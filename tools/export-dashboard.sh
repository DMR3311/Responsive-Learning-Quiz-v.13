#!/usr/bin/env bash
set -euo pipefail

if [[ ${1:-} == "" ]]; then
  echo "Usage: $0 <destination-directory>" >&2
  exit 1
fi

DEST="$1"

if [[ -e "$DEST" ]]; then
  echo "Error: destination '$DEST' already exists. Choose an empty path." >&2
  exit 1
fi

mkdir -p "$DEST"

# Files and directories needed for the standalone dashboard project.
ITEMS=(
  "package.json"
  "package-lock.json"
  "vite.config.js"
  "vercel.json"
  "index.html"
  "public"
  "src"
  "DEPLOYMENT.md"
  "WORDPRESS-DEPLOYMENT.md"
  "DEPLOYMENT-INSTRUCTIONS.md"
)

for ITEM in "${ITEMS[@]}"; do
  if [[ -e "$ITEM" ]]; then
    cp -R "$ITEM" "$DEST"/
  fi
done

cat > "$DEST/.gitignore" <<'GITIGNORE'
node_modules
.DS_Store
.env*
dist
.vercel
.idea
.vscode
npm-debug.log*
GITIGNORE

cat > "$DEST/README.md" <<'README'
# BrainTrain Admin Dashboard

This directory was generated from the Responsive Learning Quiz project using `tools/export-dashboard.sh`. It contains only the files required to run the admin dashboard as a standalone Vite + React application.

## Available scripts

```bash
npm install       # install dependencies
npm run dev       # start the local dev server
npm run build     # create a production build
npm run preview   # preview the production build locally
npm run deploy:vercel  # build and deploy using the Vercel CLI
```

## Deployment

Refer to `DEPLOYMENT.md` for hosting instructions. If you plan to embed the dashboard inside WordPress, also review `WORDPRESS-DEPLOYMENT.md`.

## Git setup

1. Run `git init` inside this folder.
2. Create a new repository on GitHub (or use `gh repo create ...`).
3. Commit the files and push to the new remote.

README

printf 'Dashboard exported to %s\n' "$DEST"
