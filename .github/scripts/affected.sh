#!/usr/bin/env bash
# Decides whether a push or pull request can change one app's build.
#
# usage: affected.sh <app directory name> <that app's workflow file name>
# env:   EVENT (github event name), BASE (commit to compare against), HEAD
#
# An app is affected when its own files change, when something every app shares
# changes, or when a shared package changes in a part the app imports: the
# whole of packages/app-core, packages/reusables when the app uses it, and only
# the packages/api modules the app reaches. Writes affected=true|false to
# GITHUB_OUTPUT. When it cannot tell, it says true.
set -euo pipefail

app="$1"
workflow="$2"
head="${HEAD:-HEAD}"
base="${BASE:-}"
out="${GITHUB_OUTPUT:-/dev/stdout}"

say() {
  echo "affected=$1" >> "$out"
  echo "$1: $2"
  exit 0
}

[ "${EVENT:-}" = "workflow_dispatch" ] && say true "manual run"
if [ -z "$base" ] || [ "$base" = "0000000000000000000000000000000000000000" ] || ! git cat-file -e "$base^{commit}" 2>/dev/null; then
  say true "no commit to compare against"
fi

modules_imported_in() {
  grep -rhoE "@truckmoov/api/[a-z0-9-]+" "$@" 2>/dev/null | sed 's#@truckmoov/api/##' | sort -u || true
}

# Modules reach each other with relative imports such as ../lib/query-client.
modules_used_by() {
  grep -rhoE "from ['\"]\.\./[a-z0-9-]+/" "packages/api/src/$1" 2>/dev/null | sed -E "s#.*\.\./([a-z0-9-]+)/#\1#" | sort -u || true
}

uses_reusables=no
grep -rqE "@truckmoov/reusables" "apps/$app/src" 2>/dev/null && uses_reusables=yes

modules=$(modules_imported_in "apps/$app/src")
if [ "$uses_reusables" = yes ]; then
  modules=$(printf '%s\n%s\n' "$modules" "$(modules_imported_in packages/reusables/src)" | sort -u)
fi
for _ in 1 2 3 4; do
  for module in $modules; do
    modules=$(printf '%s\n%s\n' "$modules" "$(modules_used_by "$module")" | sort -u)
  done
done

while IFS= read -r file; do
  [ -z "$file" ] && continue
  case "$file" in
    "apps/$app/"*) say true "$file" ;;
    package.json | pnpm-lock.yaml | pnpm-workspace.yaml | turbo.json | tsconfig*.json) say true "$file" ;;
    ".github/workflows/$workflow" | .github/scripts/*) say true "$file" ;;
    packages/app-core/*) say true "$file" ;;
    packages/reusables/*) [ "$uses_reusables" = yes ] && say true "$file" ;;
    packages/api/src/*/*)
      module=$(echo "$file" | cut -d/ -f4)
      [ "$module" = lib ] && say true "$file"
      echo "$modules" | grep -qx "$module" && say true "$file"
      ;;
    packages/*) say true "$file" ;;
  esac
done < <(git diff --name-only "$base" "$head")

say false "nothing this app uses changed"
