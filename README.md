<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1uUyODNMJ3FlSDwe2ou_w6LJA0qNQJPT1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`
3. Open the app and paste your Gemini API key in **API Settings**.
   - You can paste multiple keys (one per line); the trainer will rotate through the list on every request.

## Deploy to GitHub Pages (GitHub Actions)

1. Ensure your default branch is `main`.
2. In GitHub: **Settings → Pages**
   - Set **Source** to **GitHub Actions**.
3. Push to `main`.

The workflow at [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml) builds the SPA and publishes `dist/` to Pages.
