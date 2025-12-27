# Run and deploy your app

This contains everything you need to run your app locally.

Deployed app: https://trimblespark-trainer.pages.dev/
<div align="center">
  <img width="100%" alt="TrimbleSpark Trainer App Screenshot" src="https://github.com/user-attachments/assets/aec10b5d-b0de-4ce1-be43-8207b8db0d2d" />
</div>

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local)
3. Run the app:
   `npm run dev`

## Features

- Practice modules for point cloud, geospatial, telematics, and asset management topics
- Review Center for missed questions
- 10-question exam mode
- Built-in PySpark editor (Monaco) plus a Sandbox editor
- Local backup/restore of progress (JSON)

## Environment Variables

- `GEMINI_API_KEY` (required): API key used for challenge generation and evaluation

## Build & Preview

- Build: `npm run build`
- Preview: `npm run preview`

## Data Storage

Progress is stored in the browser using `localStorage`. Use the Backup/Restore actions in the sidebar to export or import progress.
