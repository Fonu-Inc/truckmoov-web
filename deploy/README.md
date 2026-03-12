# Frontend deployment

This repo deploys the static TruckMoov frontend to the existing server over SSH.

## GitHub Actions flow

- `pull_request`: installs dependencies, lints, verifies architecture boundaries, and builds the Vite app.
- `push` to `main`: runs the same validation, uploads the built `dist/`, then deploys it to `/var/www/truckmoov-web` on the remote host.
- `workflow_dispatch`: lets you trigger the same pipeline manually.

## Repository secrets

The workflow uses these existing repository secrets for SSH access:

- `DEV_SSH_HOST`
- `DEV_SSH_USER`
- `DEV_SSH_KEY`

Optional:

- `DEV_SSH_PORT` defaults to `22` when omitted.

## Optional build-time secrets

If you want production values baked into the frontend build, add any of these repository secrets:

- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_BACKEND_URL`
- `VITE_FONU_COMPANY_UUID`
- `VITE_FONU_API_KEY`

If they are not set, the workflow falls back to the mock defaults from `.env.example`.

## Remote host requirements

The SSH target must already have:

- `tar`
- write access to `/var/www/truckmoov-web` for the SSH user
- a web server already configured to serve files from `/var/www/truckmoov-web`

## Server layout

The workflow uploads a tarball to `/tmp`, extracts it into a temporary directory under `/var/www/truckmoov-web`, clears the old deployed files, and copies the new build into place.
