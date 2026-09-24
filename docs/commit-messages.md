# Commit messages

Instructions for an AI agent asked for a commit message in this repo. It reads
the working tree, writes **one** message, and **shows it in chat**. It does not
commit, does not stage, does not push — the user copies the message and commits
it themselves.

`truckmoov-web/` is **one git repo** covering all three apps and all shared
packages. Its parent directory is not a repo, and the `fleetflow-pro-main/`
folder beside it is a **different** repo — never run git commands there.

## What to do

1. From the repo root, run:

   ```sh
   git status --short
   git log --oneline -5
   ```

2. Run `git diff` **and read the untracked files** — `git diff` does not show
   them, and they are usually the most important part of the change. Get the
   untracked paths from `git status`.

3. Return **exactly one** commit message, in a fenced code block so it can be
   copied in one go. Never split the diff into several messages, even when it
   contains unrelated changes — the one message must account for everything in
   the working tree: every modified file, every untracked file, every deletion,
   every dep and env var. Nothing in the diff goes unmentioned.

   When the diff really is unrelated work, lead the summary with the largest
   change and give the rest a bullet each in the body (see Body below).

4. Above the code block, say which parts of the workspace the diff touches —
   apps, packages, docs — so it is obvious what the commit covers:

   ```
   Touches: apps/main, packages/api, docs/
   ```

5. If the diff spans an app **and** a shared package, say so explicitly. A
   change under `packages/**` rebuilds and redeploys every app (see Deploy
   consequences).

6. If the diff contains something that looks wrong — a leftover debug line, an
   off-by-one, a hardcoded value — mention it in one line after the message.
   Do not fix it unless asked.

7. Stop there. No `git add`, no `git commit`, no `git push`, no temp message
   file. If the user wants the commit made too, they will say so — and then
   [git-workflow.md](git-workflow.md) applies: `.husky/pre-commit` runs a turbo
   build of all three apps, so it takes minutes, and `--no-verify` is never an
   option.

## Format rules

There is **no `commit-msg` hook** in this repo — `.husky/` contains only
`pre-commit`. The format below is convention, not machine-enforced, so nothing
will catch a malformed message for you. Match it anyway; the history is
consistent and should stay that way.

```
^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\([a-z0-9-]+\))?: .+$
```

- Type is required and must be one of those eleven (the list in
  [git-workflow.md](git-workflow.md)).
- Scope is optional, and if present must be **lowercase letters, digits, and
  hyphens only** — `feat(fleet):` ok, `feat(Fleet):` and `feat(main/fleet):`
  are not.
- Colon + space + a non-empty description.
- Description is lowercase, imperative mood, no trailing period, under ~72
  chars.

## Choosing the type

| Type | Use for |
|---|---|
| `feat` | new user-facing behaviour |
| `fix` | a bug that was reachable in the running app |
| `refactor` | moves and rewrites with no behaviour change |
| `perf` | faster, same behaviour |
| `style` | formatting, class name shuffling, no logic change |
| `chore` | deps, config, tooling, ports, scripts |
| `build` | turbo, vite, or tsconfig build setup |
| `ci` | `.github/workflows/**` |
| `docs` | docs only, including `docs/**`, `README.md`, `AGENTS.md` |
| `test` | tests only |
| `revert` | reverts a commit |

## Choosing the scope

Pick the narrowest one that fits. Scopes already in use, most common first:

| Kind | Scopes |
|---|---|
| Feature area | `fleet`, `jobs`, `dispatch`, `maps`, `tracking`, `sims`, `devices`, `auth`, `onboarding`, `settings`, `billing`, `payments`, `support`, `whatsapp` |
| App | `main`, `admin`, `landing` |
| Shared package | `api`, `reusables`, `app-core` |
| Infra | `ci`, `lint`, `ui` |

Rules:

- Use the **feature** scope when the change lives inside one feature, even if
  it spans an app and a package: `feat(sims): ...`.
- Use the **app** scope when the change spans several features of one app:
  `fix(main): ...`.
- Use the **package** scope when the change is only in `packages/**` and is not
  about one feature: `refactor(api): ...`.
- Omit the scope when the change spans the whole repo.

## Body

The body is a **summary of what was done**, not a walkthrough of the diff. A
reader should get the shape of the change in ten seconds.

```
type(scope): one-line summary of the biggest change, under ~72 chars

- one bullet per notable change, one line each
- new deps, new env vars, renamed or moved files
- unrelated work that rode along gets its own bullet, not a section
```

Rules for the body:

- Summarise. One bullet per change — not per file, not per edited function.
  If a bullet needs a second line to justify itself, it is too detailed.
- Aim for 3-6 bullets, hard cap ~8. Needing more means the summary line is
  wrong, not that the body needs more room.
- No explanatory paragraph. The exception is a `fix` whose cause is not
  obvious from the summary line — then **one sentence**, not a paragraph.
- Still name these, always, because they break other people:
  - every new env var and every new dependency, by name
  - `pnpm-lock.yaml` or `pnpm-workspace.yaml` changing
  - file moves and renames, and anything added to `packages/reusables`
  - a shared type or API payload getting stricter
- One bullet for deliberately unfinished work ("nothing consumes the picked
  id yet") so a reviewer does not assume it is wired up.
- Note a `ponytail:` comment only if it marks a real limitation.
- No "Generated with" footer, no Co-Authored-By, unless asked.
- Skip the body entirely for one-liners like a port change or a dep bump.

## Deploy consequences

Worth a line in the message when they apply, because pushing `main` acts on
them immediately:

- Push to `main` runs one workflow per app in `.github/workflows/`:
  `frontend-cicd.yml` (`apps/main`), `admin-cicd.yml` (`apps/admin`),
  `installer-cicd.yml` (`apps/installer`), `landing-page-cicd.yml`
  (`apps/landing-page`).
- Each is path-filtered on its own app **plus** `packages/**`,
  `package.json`, and `pnpm-lock.yaml` — so any shared-package change deploys
  **every** app.
- Production env comes from the base64 GitHub secrets `MAIN_ENV`,
  `ADMIN_ENV`, `INSTALLER_ENV`, and `LANDING_ENV`. If a commit adds an env var
  and the secret isn't updated, CI silently falls back to `.env.example` and
  the deployed app runs without it. PR builds never receive these secrets and
  always build from `.env.example`.
  Always name new env vars in the body.

## Example

The whole reply looks like this — touches line, copyable message, one-line
concern:

---

Touches: apps/main, packages/api, packages/reusables

```
fix(settings): send real UserRole values when inviting and editing members

Organization Settings translated its role picker through four legacy maps
before hitting the API, so every invite landed as the tenant's default role.

- UserRole is now a const object in packages/api, usable as a value as well
  as a type
- InviteUserPayload.role and ChangeRolePayload.newRole are typed UserRole, so
  a wrong string is a compile error
- drop the four legacy role maps from Settings.tsx
- the Maintenance Supervisor and Analyst options are gone; no backend role
- also dedupes the "all" option in the shared TableToolbar status select
```

Heads up: `Settings.tsx:214` still has a `console.log(payload)` from
debugging — left as is.
