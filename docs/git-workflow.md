# Git Workflow

This project uses a Husky hook to build before every commit.

## Hooks

| Hook | When it runs | Purpose |
|------|--------------|---------|
| `pre-commit` | Before a commit is created | Runs `pnpm run build` |

`pnpm run build` is a turbo build of all three apps and the shared packages, so
a commit takes minutes. If the build fails, fix the reported issue and commit
again. Never bypass it with `--no-verify`.

## Commit Messages

There is no `commit-msg` hook, so the format below is convention rather than
something the repo enforces. See [commit-messages.md](commit-messages.md) for
the full guide — scopes, body structure, and what a commit must mention.

Commit messages must use:

```text
type: description
```

Allowed types:

- `build`
- `chore`
- `ci`
- `docs`
- `feat`
- `fix`
- `perf`
- `refactor`
- `revert`
- `style`
- `test`

Good examples:

```bash
git commit -m "feat: add user authentication"
git commit -m "fix: resolve mobile navigation bug"
git commit -m "docs: update api documentation"
```

Bad examples:

```bash
git commit -m "Add feature"
git commit -m "FEAT: add feature"
git commit -m "feature: add login"
```
