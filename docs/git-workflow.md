# Git Workflow

This project uses Husky hooks to validate commit messages and build before every commit.

## Hooks

| Hook | When it runs | Purpose |
|------|--------------|---------|
| `commit-msg` | After the commit message is written | Validates conventional commit format |
| `pre-commit` | Before a commit is created | Runs `pnpm run build` |

If the build fails, fix the reported issue and commit again.

## Commit Messages

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
