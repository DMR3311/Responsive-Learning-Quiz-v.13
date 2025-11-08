# Publish the Admin Dashboard as Its Own GitHub Project

This guide walks you through copying the admin dashboard into a fresh folder, creating a new Git repository, and pushing it to GitHub. The process takes about five minutes once you have Git and Node 20+ installed locally.

## 1. Prepare a clean working directory

```bash
# clone or download this repo if you have not already
cd path/to/Responsive-Learning-Quiz-v.13

# ensure dependencies are installed (optional but recommended)
npm install
```

## 2. Export the dashboard code

Use the helper script that ships with this repository to copy only the dashboard-specific assets into a new folder. You can pick any destination path; the default example creates a sibling directory named `braintrain-admin-dashboard`.

```bash
./tools/export-dashboard.sh ../braintrain-admin-dashboard
```

The script copies the application source, public assets, Vite config, deployment settings, and a tailored `.gitignore`. It intentionally skips build artifacts, local environment files, and the original Git history so you start clean.

## 3. Initialize a new Git repository

```bash
cd ../braintrain-admin-dashboard
git init
npm install
```

## 4. Create the GitHub project

```bash
gh repo create braintrain-admin-dashboard --public --source=. --remote=origin --push
```

If you do not use the GitHub CLI, create the repository manually at <https://github.com/new>, then run the commands shown in the “Quick setup” box (typically `git remote add origin ...` and `git push -u origin main`).

## 5. Deploy from the new repository

Once the repo lives on GitHub you can hook it into Vercel (or Netlify) exactly like any other standalone project. The deployment instructions inside the exported project remain unchanged, so `npm run deploy:vercel` will continue to work after you configure Vercel to pull from the new repository.

## Troubleshooting tips

- **Script complains the target already exists** – remove the folder first or supply a different destination.
- **Missing `gh` command** – install the GitHub CLI or push using regular Git commands copied from the GitHub web UI.
- **Dependency errors after `npm install`** – confirm you are using Node 20.19 or newer (`node --version`).

With the exported project pushed to GitHub, the dashboard is fully decoupled from the original quiz repository and can evolve independently.
