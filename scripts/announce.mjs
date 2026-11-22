#!/usr/bin/env node
// Announce new journal entries on Discord and Matrix, once they are live.
//
//   node scripts/announce.mjs [--dry-run]
//
// Run by deploy/autodeploy.sh after every check. It reads the feeds of the
// site being served (the "current" release, so every link already works),
// and posts each entry it hasn't announced yet: the original, with a link to
// its translation when there is one. What was announced is kept per channel
// in $ANNOUNCE_STATE (default ~/announced), so a channel that fails is tried
// again on the next run without posting twice to the other.
//
// Configuration, from the environment (deploy/systemd: EnvironmentFile):
//   DISCORD_WEBHOOK_URL    a channel's webhook (Channel settings → Integrations)
//   MATRIX_HOMESERVER      e.g. https://matrix.velade.org
//   MATRIX_ACCESS_TOKEN    of the account that posts, already in the room
//   MATRIX_ROOM            a room ID (!abc:velade.org) or alias (#news:velade.org)
// A channel without its settings is skipped.
//
// The first run, with no state file, only records the entries that exist,
// so the journal's back catalogue is never posted. Entries published more
// than MAX_AGE_DAYS ago are never announced either.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const SITE = process.env.DEPLOY_PATH ? join(process.env.DEPLOY_PATH, 'current') : '/var/www/velade.org/current';
const STATE = process.env.ANNOUNCE_STATE || join(homedir(), 'announced');
const MAX_AGE_DAYS = 14;
const DRY_RUN = process.argv.includes('--dry-run');

// The feeds in the order their entries are offered: English originals first,
// then the Italian ones, whose entries also have an English version.
const FEEDS = { en: 'rss.xml', it: 'it/rss.xml' };

const decode = (text) =>
  text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, '&');

/** The items of a feed the site builds (src/lib/feed.ts). */
function readFeed(lang) {
  const file = join(SITE, FEEDS[lang]);
  if (!existsSync(file)) return [];
  const xml = readFileSync(file, 'utf8');
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => {
    const field = (name) => decode(item.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1] ?? '').trim();
    const link = field('link');
    return {
      lang,
      title: field('title'),
      description: field('description'),
      link,
      // The entry's id, shared by an original and its translations: /it/blog/x/ and /blog/x/ → x.
      id: new URL(link).pathname.replace(/^\/[a-z]{2}\//, '/').replace(/^\/blog\/|\/$/g, ''),
      published: new Date(field('pubDate')),
    };
  });
}

function loadState() {
  if (!existsSync(STATE)) return null;
  return new Set(readFileSync(STATE, 'utf8').split('\n').filter(Boolean));
}

function saveState(state) {
  if (DRY_RUN) return;
  writeFileSync(STATE, [...state].sort().join('\n') + '\n');
}

/** The message, in plain text and in HTML (Matrix shows the HTML). */
function message(entry, translation) {
  const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const other = translation
    ? { text: `\nIn italiano: ${translation.link}`, html: `<br>In italiano: <a href="${translation.link}">${escape(translation.title)}</a>` }
    : { text: '', html: '' };
  return {
    text: `New on the Vela blog: ${entry.title}\n${entry.description}\n${entry.link}${other.text}`,
    html: `New on the Vela blog: <a href="${entry.link}"><b>${escape(entry.title)}</b></a><br>${escape(entry.description)}${other.html}`,
  };
}

async function check(response, what) {
  if (!response.ok) throw new Error(`${what}: ${response.status} ${(await response.text()).slice(0, 200)}`);
}

const channels = {
  discord: process.env.DISCORD_WEBHOOK_URL && {
    async post(entry, translation) {
      // <link> keeps Discord from previewing the translation too: one card is enough.
      const text = message(entry, translation).text.replace(/^In italiano: (\S+)$/m, 'In italiano: <$1>');
      const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // A title can't ping @everyone or anyone else.
        body: JSON.stringify({ content: text, allowed_mentions: { parse: [] } }),
        signal: AbortSignal.timeout(15_000),
      });
      await check(response, 'Discord');
    },
  },
  matrix: process.env.MATRIX_HOMESERVER &&
    process.env.MATRIX_ACCESS_TOKEN &&
    process.env.MATRIX_ROOM && {
      async post(entry, translation) {
        const server = process.env.MATRIX_HOMESERVER.replace(/\/$/, '');
        const auth = { Authorization: `Bearer ${process.env.MATRIX_ACCESS_TOKEN}` };
        let room = process.env.MATRIX_ROOM;
        if (room.startsWith('#')) {
          const response = await fetch(`${server}/_matrix/client/v3/directory/room/${encodeURIComponent(room)}`, {
            headers: auth,
            signal: AbortSignal.timeout(15_000),
          });
          await check(response, `Matrix alias ${room}`);
          room = (await response.json()).room_id;
        }
        const { text, html } = message(entry, translation);
        // The same transaction ID for the same entry: if a run dies after the
        // homeserver got the message, the retry doesn't post it again.
        const txn = createHash('sha256').update(entry.link).digest('hex').slice(0, 32);
        const response = await fetch(
          `${server}/_matrix/client/v3/rooms/${encodeURIComponent(room)}/send/m.room.message/${txn}`,
          {
            method: 'PUT',
            headers: { ...auth, 'Content-Type': 'application/json' },
            body: JSON.stringify({ msgtype: 'm.notice', body: text, format: 'org.matrix.custom.html', formatted_body: html }),
            signal: AbortSignal.timeout(15_000),
          },
        );
        await check(response, 'Matrix');
      },
    },
};

async function main() {
  const english = readFeed('en');
  const italian = readFeed('it');
  if (english.length === 0) {
    console.log(`announce: no feed at ${SITE}; nothing to do.`);
    return;
  }

  // One announcement per entry: its English version, which every entry has,
  // with the Italian one alongside.
  const entries = english.map((entry) => ({ entry, translation: italian.find((it) => it.id === entry.id) }));

  let state = loadState();
  if (state === null) {
    state = new Set(Object.keys(channels).flatMap((name) => entries.map(({ entry }) => `${name} ${entry.link}`)));
    saveState(state);
    console.log(`announce: first run; recorded ${entries.length} existing entries without posting them.`);
    return;
  }

  const oldest = Date.now() - MAX_AGE_DAYS * 86_400_000;
  let failed = false;
  for (const [name, channel] of Object.entries(channels)) {
    if (!channel) {
      // A channel set up later starts from then on, not with the entries it missed.
      for (const { entry } of entries) state.add(`${name} ${entry.link}`);
      saveState(state);
      continue;
    }
    // Oldest first, so a day with two entries posts them in order.
    for (const { entry, translation } of [...entries].reverse()) {
      const key = `${name} ${entry.link}`;
      if (state.has(key) || entry.published.valueOf() < oldest) continue;
      if (DRY_RUN) {
        console.log(`announce (dry run): ${name} ← ${message(entry, translation).text.replace(/\n/g, ' | ')}`);
        continue;
      }
      try {
        await channel.post(entry, translation);
        state.add(key);
        saveState(state);
        console.log(`announce: posted "${entry.title}" to ${name}.`);
      } catch (error) {
        failed = true;
        console.error(`announce: ${name}: ${error.message}; will try again on the next run.`);
        break;
      }
    }
  }
  process.exitCode = failed ? 1 : 0;
}

await main();
