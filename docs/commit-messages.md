# Commit messages

Instructions for an AI agent asked to commit, or to write a commit message, in
this repo. It writes the message, shows it, then makes the commit.

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

3. Return **exactly one** commit message. Never split the diff into several
   messages, even when it contains unrelated changes — the one message must
   account for everything in the working tree: every modified file, every
   untracked file, every deletion, every dep and env var. Nothing in the diff
   goes unmentioned.

   When the diff really is unrelated work, lead the summary with the largest
   change and group the rest under short headings in the body (see Body below).

4. Say up front which parts of the workspace the diff touches — apps, packages,
   docs — so it is obvious what the commit covers:

   ```
   Touches: apps/main, packages/api, docs/

   feat(settings): ...
   ```

5. If the diff spans an app **and** a shared package, say so explicitly. A
   change under `packages/**` rebuilds and redeploys both `main` and `admin`
   (see Deploy consequences).

6. If the diff contains something that looks wrong — a leftover debug line, an
   off-by-one, a hardcoded value — mention it in one line after the message.
   Do not fix it unless asked.

7. Then make the commit:

   ```sh
   git add -A
   git commit -F <message-file>
   ```

   Use `-F` with a temp file, not `-m` — the body has blank lines and
   backticks that a shell-quoted `-m` mangles. Write the temp file to the
   scratchpad dir, not into the repo.

   - Do not `git push`. Committing is the end of the job. Pushing to `main`
     deploys — that is the user's call, not yours.
   - Never pass `--no-verify`. `.husky/pre-commit` runs `pnpm run build`, which
     is a turbo build of all three apps plus packages, so a commit takes
     minutes — let it.
   - If the pre-commit build fails, stop, show its output, and do not retry.
     Fix nothing unless asked.
   - After the commit, print the resulting `git log --oneline -1`.

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

A "detailed" message means:

```
type(scope): one-line summary of the biggest change, under ~72 chars

Why the change was needed — the behaviour before, and what was wrong or
missing about it. One short paragraph, wrapped at 72 columns.

- the notable individual changes, one per line
- new deps, new env vars, renamed or moved files
- anything a reviewer would otherwise have to reverse-engineer from the diff

Second change:

- same treatment, one heading per unrelated piece of work

Trailing line for incidental changes that rode along.
```

Use the plain single-block form when the diff is one coherent change. Add the
headings only when it is not — but either way, one message covering everything.

Rules for the body:

- Explain **why**, not what — the diff already shows what.
- Mention every new env var and every new dependency by name. These break
  other people's builds and, for env vars, the deploy (see below).
- Say when `pnpm-lock.yaml` or `pnpm-workspace.yaml` changed and why.
- Mention file moves and renames explicitly, and anything newly added to
  `packages/reusables` — shared components affect both `main` and `admin`.
- Note when a shared type or API payload got stricter; that is what turns
  someone else's working code into a type error.
- Call out deliberately unfinished work ("the picked id is local state for
  now — nothing consumes it yet") rather than letting a reviewer assume it's
  wired up.
- Note `ponytail:` comments in the diff if they mark a real limitation.
- No "Generated with" footer, no Co-Authored-By, unless asked.
- Skip the body entirely for one-liners like a port change or a dep bump.

## Deploy consequences

Worth a line in the message when they apply, because pushing `main` acts on
them immediately:

- Push to `main` runs `.github/workflows/frontend-cicd.yml` (deploys
  `apps/main`) and `admin-cicd.yml` (deploys `apps/admin`).
- Both are path-filtered on their own app **plus** `packages/**`,
  `package.json`, and `pnpm-lock.yaml` — so any shared-package change deploys
  **both** apps.
- `apps/landing-page/**` has no workflow. Changes there never build or deploy
  in CI.
- Production env comes from the base64 GitHub secrets `MAIN_ENV` and
  `ADMIN_ENV`. If a commit adds an env var and the secret isn't updated, CI
  silently falls back to `.env.example` and the deployed app runs without it.
  Always name new env vars in the body.

## Example

```
fix(settings): send real UserRole values when inviting and editing members

Organization Settings translated its role picker through four legacy maps
before hitting the API, sending values like `viewer_finance` and
`supervisor` that the backend's role enum does not contain — so every
invite landed as the tenant's default role instead of the chosen one.

- turn UserRole into a const object in packages/api so it is usable as a
  value (`UserRole.FLEET_ADMIN`) as well as a type; a real TS enum would
  break the ~80 existing string-literal comparisons
- type InviteUserPayload.role and ChangeRolePayload.newRole as UserRole, so
  a wrong string is now a compile error
- drop INVITE_ROLE_TO_DB, DISPLAY_ROLE_TO_DB, roleDisplayMap and
  reverseRoleMap from Settings.tsx
- the Maintenance Supervisor and Analyst options are gone; the backend has
  no matching role, marked with a ponytail: comment

Also dedupes the "all" option in the shared TableToolbar status select,
which rendered two labels at once.
```
