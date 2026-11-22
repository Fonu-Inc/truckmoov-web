# Landing Page Deploy

The landing page is a Next.js app with `output: "export"`. `next build` writes the complete
static site to `apps/landing-page/out/`; nginx serves that folder directly. There is no Node
process, no systemd unit and no pm2 app.

## What CI ships

`.github/workflows/landing-page-cicd.yml`, on a push to `main`:

1. Writes `apps/landing-page/.env.production` from the `LANDING_ENV` secret (or copies
   `.env.example` on pull requests).
2. Runs `pnpm turbo build --filter landing-page` on Node 22.
3. Checks the export contains `out/index.html`, `out/404.html` and `out/_next/static/`.
4. Tars the contents of `apps/landing-page/out` as `truckmoov-landing-release.tar.gz`.
5. Pipes the archive to `deploy truckmoov-landing <release>`.

The archive root is the site root:

```text
index.html  404.html  _next/  images/  brand/
sitemap.xml  robots.txt  manifest.webmanifest  icon.jpg
opengraph-image  apple-icon
```

`opengraph-image` and `apple-icon` are extensionless metadata routes. Nginx must send them as
`image/png`; otherwise they are served as `application/octet-stream` and social crawlers may
ignore the preview card.

## Static export constraints

- `cacheComponents` and `partialPrefetching` are **off**: they enable PPR, which Next refuses
  to combine with `output: "export"`.
- `"use cache"` / `cacheLife` are not used. Every page is plain static generation.
- `next/image` runs with `unoptimized: true`. The site serves the original image files; there
  is no `/_next/image` endpoint. Size images for their rendered box before committing them.
- Metadata routes (`sitemap`, `robots`, `manifest`, `opengraph-image`, `apple-icon`) export
  `dynamic = "force-static"` so they are emitted at build time.
- Dynamic `[slug]` routes export every slug via `generateStaticParams`. Unknown slugs have no
  file under `out/`, so nginx answers 404. `src/proxy.ts` remains only for `next dev`.

## Environment

`LANDING_ENV` is a base64 `.env` file. It must contain:

```sh
NEXT_PUBLIC_BACKEND_URL="https://api.truckmoov.com/"
NEXT_PUBLIC_SITE_URL="https://truckmoov.com"       # canonical URLs, sitemap, Open Graph
NEXT_PUBLIC_MAIN_APP_URL="https://app.truckmoov.com"  # Sign In buttons go to <it>/auth
```

All three are `NEXT_PUBLIC_*`, so Next inlines them **at build time**. The server needs no
runtime `.env` for this app; changing the secret takes effect on the next build.

## Server layout

```text
/var/www/truckmoov-landing/
  releases/<release>/     unpacked export: index.html, _next/, images/, …
  current -> releases/<release>
```

`deploy truckmoov-landing <release>` must:

1. Read the archive from stdin and unpack it into `releases/<release>/`.
2. Point `current` at the new release: `ln -sfn releases/<release> current`.
3. Run `nginx -t` and reload nginx. No service restart.
4. Prune old releases as before.

`truckmoov-landing` is already in the wrapper's `STATIC_APPS`. Remove the
`elif [[ "$app" == "truckmoov-landing" ]]` branches from `do_deploy` and `do_rollback` so it
follows the normal static-app path. There is no `package.json` or `npm ci` step, and no sudo
command.

## nginx

TLS, gzip and brotli stay as they are today. The `truckmoov.com` block becomes:

```nginx
server {
  listen 443 ssl http2;
  server_name truckmoov.com;

  root /var/www/truckmoov-landing/current;
  index index.html;

  location / {
    try_files $uri $uri.html $uri/ =404;
  }

  # Content-hashed build assets: safe to cache forever.
  location /_next/static/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
  }

  # Extensionless metadata routes; nginx has no MIME type for these paths.
  location = /opengraph-image {
    default_type image/png;
  }

  location = /apple-icon {
    default_type image/png;
  }

  error_page 404 /404.html;
  location = /404.html {
    internal;
  }
}
```

Drop the old `truckmoov_landing` upstream and every `proxy_pass` to it.

## Checking a deploy

```sh
curl -fsSI https://truckmoov.com/                         # 200, text/html
curl -fsS  https://truckmoov.com/sitemap.xml | head       # absolute URLs use NEXT_PUBLIC_SITE_URL
curl -fsSI https://truckmoov.com/_next/static/<any file>  # Cache-Control: … immutable
curl -fsSI https://truckmoov.com/opengraph-image          # Content-Type: image/png
```
