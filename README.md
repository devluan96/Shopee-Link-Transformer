<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/df09c48c-7a5b-4b5e-bd1b-7c65d5303828

## Run Locally

**Prerequisites:**  Node.js 22.x LTS
If `node -v` still shows `v20.x`, install Node 22 LTS and reopen your terminal before running the app.
On Windows, download the latest Node.js 22 LTS Windows Installer (`.msi`) from the official [Node.js downloads page](https://nodejs.org/en/download), run the installer, then verify with `node -v` in a new terminal.


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deployment

For a `staging -> production` rollout with a test domain, see [docs/staging-deployment.md](docs/staging-deployment.md).
For a click-by-click GitHub/Vercel setup checklist, see [docs/github-vercel-setup-checklist.md](docs/github-vercel-setup-checklist.md).
For pre-release testing on staging, see [docs/uat-checklist.md](docs/uat-checklist.md).
For a social publishing blueprint covering YouTube, TikTok, and Facebook Pages, see [docs/social-publisher-blueprint.md](docs/social-publisher-blueprint.md).
