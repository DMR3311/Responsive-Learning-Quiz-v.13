# Responsive Learning Quiz & Admin Dashboard

This repository houses the interactive quiz experience along with the accompanying admin dashboard that reports on visits, signups, class purchases, scheduling activity, and quiz outcomes.

## Local development

```bash
npm install
npm run dev
```

Visit <http://localhost:5173> while the dev server is running.

## Production build

```bash
npm run build
npm run preview
```

Preview runs a local server that serves the production output from `dist/`.

## Deployments

- **Vercel:** `npm run deploy:vercel`
- **Other platforms:** See `DEPLOYMENT.md` and `WORDPRESS-DEPLOYMENT.md` for detailed walkthroughs.

## Exporting the admin dashboard into its own GitHub project

If you want the dashboard to live in a dedicated repository, run the export helper and follow the instructions in [`docs/GITHUB-NEW-PROJECT.md`](docs/GITHUB-NEW-PROJECT.md).

```bash
./tools/export-dashboard.sh ../braintrain-admin-dashboard
```

The script copies only the files required for the dashboard, writes a fresh `.gitignore`, and drops in a README tailored to the standalone project so you can commit and push it immediately.
