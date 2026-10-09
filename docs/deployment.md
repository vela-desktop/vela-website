# Deploying velade.org

velade.org is a fully static site. Production is plain files on disk, served by
the Apache already running on the Debian VM. There is no Node.js process,
database or container at runtime.

```
Internet ──HTTPS──▶ Nginx Proxy Manager Plus ──HTTP :80──▶ Debian VM (Proxmox) ──▶ Apache ──▶ /var/www/velade.org/current
                    (TLS, certificates, HSTS)               (static files, caching, 404s)
```

The site is added as a name-based virtual host, so anything else this Apache
already serves keeps working. (If the VM runs Nginx instead, see the appendix.)

Placeholders used below — replace them with your own values:

| Placeholder | Meaning |
|---|---|
| `<VM_IP>` | LAN address of the Debian VM that serves the site |
| `<NPM_PROXY_IP>` | LAN address of the Nginx Proxy Manager Plus host |
| `<ADMIN_NET>` | network you administer the VM from (for SSH), e.g. a /24 |
| `deploy` | the account that uploads releases (any name works) |

Files in this repository used for deployment:

- `deploy/apache/velade.org.conf` — the Apache virtual host
- `scripts/deploy.sh` — build, upload and switch to a new release
- `deploy/nginx/` — the equivalent configuration for Nginx (appendix only)

---

## 1. Prepare the Debian VM (once)

Tested against Debian 13 (trixie) with its packaged Apache 2.4. First check what
the VM is running and which port Apache listens on:

```sh
systemctl status apache2          # should be active (running)
sudo apache2ctl -S                # lists ports and existing virtual hosts
ip -4 addr                        # the VM's LAN address: this is <VM_IP>
sudo apt install rsync            # needed by the deploy script
```

**A deploy account and the site directory.** Releases live in
`/var/www/velade.org/releases/<timestamp>/`; `current` is a symlink to the live one.

```sh
sudo adduser --disabled-password --gecos "" deploy
sudo mkdir -p /var/www/velade.org/releases
sudo chown -R deploy:deploy /var/www/velade.org
sudo chmod 755 /var/www/velade.org
```

Apache (`www-data`) only needs to read these files; the default `umask` gives it that.

**SSH access for deploys.** From your workstation, copy your public key to the
deploy account (or paste it into `/home/deploy/.ssh/authorized_keys`):

```sh
ssh-copy-id deploy@<VM_IP>
```

**Install the Apache virtual host.** Copy `deploy/apache/velade.org.conf` to the
VM first (e.g. `scp deploy/apache/velade.org.conf deploy@<VM_IP>:`), then:

```sh
sudo cp ~deploy/velade.org.conf /etc/apache2/sites-available/velade.org.conf
sudo a2enmod headers rewrite
sudo a2ensite velade.org
sudo apache2ctl configtest && sudo systemctl reload apache2
```

Existing sites are untouched: do **not** disable them. If Apache listens on a port
other than 80, change `<VirtualHost *:80>` in both blocks to that port and use it
as the *Forward Port* in the proxy.

Optional:

- To log real visitor addresses instead of the proxy's: `sudo a2enmod remoteip`,
  replace `<NPM_PROXY_IP>` in the two `RemoteIP` lines, uncomment them, reload.
- To hide Apache's version in the `Server` header, set `ServerTokens Prod` in
  `/etc/apache2/conf-available/security.conf`. This is global: it affects every
  site on the VM.

**Firewall.** Only the proxy needs to reach port 80, and only you need SSH. With
`ufw`, for example:

```sh
sudo apt install ufw
sudo ufw default deny incoming
sudo ufw allow from <NPM_PROXY_IP> to any port 80 proto tcp
sudo ufw allow from <ADMIN_NET> to any port 22 proto tcp
sudo ufw enable
```

Proxmox's own firewall can enforce the same rules at the VM level instead.

---

## 2. Build

Building needs **Node.js 22.12 or newer** and npm. Do it on your workstation (or in
CI); the VM never needs Node.

```sh
npm ci
npm run build        # type-checks, then writes the site to dist/
```

`dist/` is the complete website. `npm run preview` serves it locally at
<http://localhost:4321> for a last look.

> Debian 13 packages Node.js 20, which is too old for Astro 7. If you prefer to
> build on the VM, install a current LTS from nodejs.org or NodeSource — it is
> only needed while building, never to serve.

---

## 3. Publish

### With the script (recommended)

```sh
DEPLOY_HOST=deploy@<VM_IP> scripts/deploy.sh
```

It runs `npm ci` and `npm run build`, uploads `dist/` to a new release directory
with `rsync` (unchanged files are hard-linked to the previous release), then
switches `current` with an atomic rename. Visitors never see a half-uploaded site,
and Apache needs no reload. The five most recent releases are kept.

Options, as environment variables: `DEPLOY_PATH` (default `/var/www/velade.org`),
`KEEP` (releases to keep, default 5), `SKIP_BUILD=1` (upload the existing `dist/`).

### By hand

```sh
release=$(date -u +%Y%m%dT%H%M%SZ)
rsync -az --delete dist/ deploy@<VM_IP>:/var/www/velade.org/releases/$release/
ssh deploy@<VM_IP> "cd /var/www/velade.org && ln -sfn releases/$release current.next && mv -T current.next current"
```

### Roll back

```sh
ssh deploy@<VM_IP>
cd /var/www/velade.org
ls -1 releases/                              # newest last
ln -sfn releases/<previous> current.next && mv -T current.next current
```

---

## 4. Nginx Proxy Manager Plus

Create one proxy host for the site. Labels below are those of Nginx Proxy Manager
Plus; small wording differences between versions are possible.

**Hosts → Proxy Hosts → Add Proxy Host**

*Details tab*

| Field | Value |
|---|---|
| Domain Names | `velade.org` and `www.velade.org` |
| Scheme | `http` |
| Forward Hostname / IP | `<VM_IP>` |
| Forward Port | `80` |
| Cache Assets | **off** — the VM's Apache already sends the right `Cache-Control` headers |
| Block Common Exploits | on |
| Websockets Support | off (not used) |
| Access List | none — publicly accessible |

*SSL tab*

| Field | Value |
|---|---|
| SSL Certificate | Request a new certificate (Let's Encrypt) for both names |
| Force SSL | on |
| HTTP/2 Support | on (and HTTP/3, if your version offers it) |
| HSTS Enabled | on — once you have confirmed the site works over HTTPS |
| HSTS Subdomains | off, unless every subdomain of velade.org is served over HTTPS |

Enter the e-mail address for Let's Encrypt and accept its terms when asked. The
*Advanced* tab needs nothing.

Both names go to the same VM: its Apache answers `velade.org` and redirects
`www.velade.org/*` to `https://velade.org/*` with a 301, so there is one
canonical address. DNS for both names must point at the proxy's public IP, with
ports 80 and 443 forwarded to it (80 is needed for Let's Encrypt and the HTTPS
redirect).

---

## 5. Check the live site

```sh
curl -sI https://velade.org/                  # 200, Cache-Control: no-cache
curl -sI https://velade.org/blog              # 301 → /blog/
curl -sI https://www.velade.org/              # 301 → https://velade.org/
curl -sI https://velade.org/missing/          # 404 (the designed 404 page)
curl -sI https://velade.org/rss.xml           # 200, application/rss+xml
curl -sI https://velade.org/sitemap-index.xml # 200
```

Before HTTPS works, you can test the VM directly from the LAN (this must show the Vela homepage, not another site):

```sh
curl -sI -H "Host: velade.org" http://<VM_IP>/
```

---

## 6. Updating the site

Write or edit content, commit, then publish:

```sh
DEPLOY_HOST=deploy@<VM_IP> scripts/deploy.sh
```

HTML is revalidated on every visit, so changes are visible immediately. Hashed
assets in `/_astro/` are cached for a year; their file names change whenever their
content does.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| 502 Bad Gateway from the proxy | Apache not running on the VM, wrong `<VM_IP>`/port, or the firewall blocks the proxy |
| The "Apache2 Debian Default Page" or another site appears | the vhost is not enabled (`sudo a2ensite velade.org`), or the proxy does not pass the `Host` header |
| 404 for every page | `current` symlink missing or pointing to an empty release: `ls -l /var/www/velade.org` |
| 500 errors | `headers` or `rewrite` module not enabled: `sudo a2enmod headers rewrite` |
| Redirects jump to `http://` | `ServerName https://velade.org` / `UseCanonicalName On` missing from the vhost |
| Redirect loop | *Force SSL* on at the proxy **and** an HTTPS redirect added on the VM — keep it only at the proxy |

---

## Appendix: serving with Nginx instead of Apache

`deploy/nginx/velade.org.conf` and `deploy/nginx/velade-headers.conf` behave the
same way (tested with Debian 13's Nginx 1.26):

```sh
sudo apt install nginx
sudo cp deploy/nginx/velade-headers.conf /etc/nginx/snippets/velade-headers.conf
sudo cp deploy/nginx/velade.org.conf /etc/nginx/sites-available/velade.org
sudo ln -s /etc/nginx/sites-available/velade.org /etc/nginx/sites-enabled/velade.org
sudo nginx -t && sudo systemctl reload nginx
```

Only one of the two servers can listen on port 80.
