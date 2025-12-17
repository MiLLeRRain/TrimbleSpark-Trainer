# Copilot instructions (trimblespark-trainer)

## Project shape
- Vite + React SPA (no backend). Entry is [index.tsx](index.tsx) → [App.tsx](App.tsx).
- UI is split into small components in [components/](components/):
  - [components/Sidebar.tsx](components/Sidebar.tsx): category navigation + import/export/reset + connection indicator.
  - [components/ExerciseCard.tsx](components/ExerciseCard.tsx): code editor + submit/evaluate + solution peek.
  - [components/SettingsModal.tsx](components/SettingsModal.tsx): user API key input.
- Core domain types live in [types.ts](types.ts) (`Category`, `Difficulty`, `Exercise`, `ExerciseStatus`, `AppSettings`).

## Data flow & state conventions
- `App.tsx` owns app state (`exercises`, `currentCategory`, `currentExerciseId`, `difficulty`, `settings`). Components are mostly controlled via props/callbacks.
- Persistence is browser-only localStorage via [services/storage.ts](services/storage.ts).
  - Exercises key: `trimble_spark_trainer_v1`
  - Settings key: `trimble_spark_settings_v1`
  - Import/export operates on the `Exercise[]` JSON shape.
- “Review” mode is derived (`status === REVIEW`) rather than stored separately.

## Gemini integration (client-side)
- Gemini calls are made directly in the browser using `@google/genai` in [services/geminiService.ts](services/geminiService.ts).
- API key resolution order is **user settings first** → bundled env key:
  - `settings.geminiApiKey || process.env.API_KEY`
- Prompts expect JSON-only responses and enforce schemas via `responseMimeType: "application/json"` and `responseSchema`.
- Important security implication: anything injected at build-time (see [vite.config.ts](vite.config.ts)) ships to users. For GitHub Pages/static hosting, prefer the Settings modal “bring your own key” flow.

## Developer workflows
- Install: `npm install`
- Dev server: `npm run dev` (Vite on port `3000`, see [vite.config.ts](vite.config.ts))
- Build: `npm run build`
- Preview: `npm run preview`
- Local secrets: use `.env.local` (ignored by git because of `*.local` in [.gitignore](.gitignore)).

## Project-specific patterns to follow
- Styling is Tailwind utility classes inline in JSX (Tailwind is loaded via CDN in [index.html](index.html)).
- Icons are from `lucide-react`.
- When adding a new training module/category:
  - Update `Category` enum in [types.ts](types.ts)
  - Sidebar will pick it up automatically via `Object.values(Category)` in [components/Sidebar.tsx](components/Sidebar.tsx)
  - Extend the prompt context switch in [services/geminiService.ts](services/geminiService.ts)
