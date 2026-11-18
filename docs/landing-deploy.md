# Landing Page Deploy

The landing page is a Next.js app with `output: "standalone"`. It is no longer a folder of
static files behind nginx: the server runs a small Node process and nginx reverse-proxies to
it. This doc is what the server side (`write-env` / `deploy` wrappers) has to do for
`truckmoov-landing`. The other apps are unchanged.

## What CI ships

`.github/workflows/landing-page-cicd.yml`, on a push to `main`:

1. Writes `apps/landing-page/.env.production` from the `LANDING_ENV` secret (or copies
   `.env.example` on pull requests).
2. Runs `pnpm turbo build --filter landing-page` on Node 22.
3. Copies `apps/landing-page/.next/static` and `apps/landing-page/public` into the standalone
   tree, so `server.js` serves them itself.
4. Tars `apps/landing-page/.next/standalone` as `truckmoov-landing-release.tar.gz`.
5. Pipes `LANDING_ENV` to `write-env truckmoov-landing`, then the archive to
   `deploy truckmoov-landing <release>`.

The archive unpacks to a monorepo-shaped tree (because `outputFileTracingRoot` is the repo
root):

```text
<release>/
  node_modules/                 traced runtime deps only (next, react, …)
  apps/landing-page/
    server.js                   the entry point
    .env*                       copied by Next from the build (the CI-written .env.production)
    .next/                      server build + static/
    node_modules/
    public/                     brand/, images/
```

Image optimisation (`next/image` → AVIF/WebP) needs `sharp`'s native binaries, including its
libvips shared libraries. Under pnpm, Next's file tracing copies the `.node` file but not the
libvips libraries next to it, and the optimiser then silently serves the original files. So
`next.config.ts` adds every `@img/sharp-*` package via `outputFileTracingIncludes`. CI builds on
Linux, so the archive carries the Linux binaries; the server needs no separate `sharp` install.
Check it after a deploy: `curl -sI -H "Accept: image/avif" "https://<site>/_next/image?url=%2Fbrand%2Flogo.png&w=256&q=75"`
must answer `Content-Type: image/avif`.

## Environment

`LANDING_ENV` is a base64 `.env` file. It must now contain:

```sh
NEXT_PUBLIC_BACKEND_URL="https://api.truckmoov.com/"
NEXT_PUBLIC_SITE_URL="https://fleetpro.example"   # public origin: canonical URLs, sitemap, Open Graph
NEXT_PUBLIC_MAIN_APP_URL="https://app.fleetpro.example"   # main (tenant) app origin: the Sign In buttons go to <it>/auth
```

Both are `NEXT_PUBLIC_*`, so Next inlines them **at build time**. Changing the secret only
takes effect on the next build, not on a restart. The build fails if either is missing or not
a URL (type-envgen validates them when `next.config.ts` loads).

The shared `.env` that `write-env` keeps on the server is still loaded at runtime (for any
future server-only variable). The process also needs three variables of its own, which the
service definitions below set:

| Variable | Value | Why |
|---|---|---|
| `PORT` | `3000` | port `server.js` listens on |
| `HOSTNAME` | `127.0.0.1` | loopback only; nginx is the public face |
| `NODE_ENV` | `production` | |

## What `deploy truckmoov-landing <release>` must do

1. Read the archive from stdin and unpack it into `releases/<release>/`.
2. Link the shared env into the app folder:
   `ln -sfn ../../../shared/.env releases/<release>/apps/landing-page/.env.production`
   (or load it with `EnvironmentFile=` / `env_file`, as below).
3. Point `current` at the new release: `ln -sfn releases/<release> current`.
4. Restart the service (`systemctl restart truckmoov-landing` or
   `pm2 reload truckmoov-landing`), then check it answers:
   `curl -fsS http://127.0.0.1:3000/ >/dev/null`. Roll `current` back and restart if it fails.
5. Prune old releases as before.

No `pnpm install` on the server: the standalone tree already holds its `node_modules`. The
server needs Node 22.

### systemd

`/etc/systemd/system/truckmoov-landing.service`:

```ini
[Unit]
Description=Truckmoov landing page (Next.js)
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/srv/truckmoov-landing/current/apps/landing-page
EnvironmentFile=/srv/truckmoov-landing/shared/.env
Environment=PORT=3000
Environment=HOSTNAME=127.0.0.1
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

`systemctl daemon-reload && systemctl enable --now truckmoov-landing` once; the deploy wrapper
then only runs `systemctl restart truckmoov-landing`. `WorkingDirectory` goes through the
`current` symlink, so a restart always picks up the new release.

### pm2

`/srv/truckmoov-landing/ecosystem.config.cjs`:

```js
module.exports = {
  apps: [
    {
      name: "truckmoov-landing",
      cwd: "/srv/truckmoov-landing/current/apps/landing-page",
      script: "server.js",
      env_file: "/srv/truckmoov-landing/shared/.env",
      env: {
        PORT: "3000",
        HOSTNAME: "127.0.0.1",
        NODE_ENV: "production",
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
    },
  ],
};
```

`pm2 start ecosystem.config.cjs && pm2 save` once; the deploy wrapper then runs
`pm2 reload truckmoov-landing --update-env`. (`env_file` needs pm2 ≥ 5.3; on older pm2, source
the `.env` in the wrapper before `pm2 reload`.)

## nginx

Replaces the old `root …/dist; try_files … /index.html;` block. TLS directives stay as they
are today.

```nginx
upstream truckmoov_landing {
  server 127.0.0.1:3000;
  keepalive 16;
}

server {
  listen 443 ssl http2;
  server_name fleetpro.example;   # the NEXT_PUBLIC_SITE_URL host

  gzip on;
  gzip_vary on;
  gzip_proxied any;
  gzip_types text/plain text/css application/javascript application/json
             image/svg+xml application/xml application/manifest+json;
  # Needs ngx_brotli; drop these two lines if the module is not installed.
  brotli on;
  brotli_types text/plain text/css application/javascript application/json
               image/svg+xml application/xml application/manifest+json;

  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header Connection "";
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;

  # Content-hashed build assets: safe to cache forever.
  location /_next/static/ {
    proxy_pass http://truckmoov_landing;
    add_header Cache-Control "public, max-age=31536000, immutable";
  }

  location / {
    proxy_pass http://truckmoov_landing;
  }
}
```

HTML, `/_next/image`, `/sitemap.xml`, `/robots.txt`, `/opengraph-image` and the files from
`public/` keep the `Cache-Control` headers Next sets, so they are not overridden here.

## Checking a deploy

```sh
curl -fsSI http://127.0.0.1:3000/                       # 200 from the Node process
curl -fsS  https://<host>/sitemap.xml | head            # absolute URLs use NEXT_PUBLIC_SITE_URL
curl -fsSI https://<host>/_next/static/<any file>       # Cache-Control: … immutable
```
