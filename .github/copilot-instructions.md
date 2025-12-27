# Copilot instructions (TrimbleSpark Trainer)

Summary
- Vite + React SPA (no backend). Entry: `index.tsx` → `App.tsx`. App owns state, components are controlled via props.

Big picture
- `App.tsx` is the single source of truth: exercises, currentCategory, currentExerciseId, difficulty, settings, examSession.
- UI: small, focused components in `components/` — key ones are `Sidebar.tsx`, `ExerciseCard.tsx`, `SettingsModal.tsx`, `SandboxView.tsx`, `ExamView.tsx`.
- Domain models live in `types.ts` (e.g., `Category`, `Exercise`, `ExerciseStatus`). Update the enum there when adding categories.

Persistence & state patterns
- Local-only persistence via `services/storage.ts`. Exercises key: `trimble_spark_trainer_v1`.
- Settings (API keys, selected model) are managed through `services/apiKeyStore.ts` and persisted locally (settings key referenced elsewhere as `trimble_spark_settings_v1`).
- Review mode is derived: exercises with `status === ExerciseStatus.REVIEW` are surfaced in the Review UI.
- Important UI note: `ExerciseCard` is keyed by `exercise.id` in `App.tsx` to force editor remount on change.

AI integration (Gemini)
- Client-side calls use `@google/genai` in `services/geminiService.ts` (GoogleGenAI, models.generateContent).
- Prompts enforce JSON via `responseMimeType: "application/json"` and `responseSchema` — parse `response.text` as JSON.
- API key resolution: `getNextApiKey()` / `getAnyApiKey()` in `services/apiKeyStore.ts`, fallback to `import.meta.env.VITE_GEMINI_API_KEY`.
- Error handling: `geminiService` dispatches a `gemini:keyError` window event for UI to react to missing/invalid keys.
- Generation contracts: system instruction requires strict formatting (e.g., `expectedOutputExample` must be a perfectly aligned ASCII table). Tests and UI rely on this shape.

Conventions & libraries
- Styling: inline Tailwind utility classes (Tailwind loaded via CDN in `index.html`).
- Icons: `lucide-react`.
- Editor: `monaco-editor` configured in `services/monacoSetup.ts`.
- AI model selection: `Sidebar` lists and refreshes models (calls `listAvailableModels()` in `geminiService.ts`).

Developer workflows
- Install: `npm install`
- Dev: `npm run dev` (Vite). Check `vite.config.ts` for overrides.
- Build: `npm run build`
- Preview: `npm run preview`

Common tasks & how-tos
- Add a training Category: update `Category` in `types.ts` → `Sidebar.tsx` auto-reads via `Object.values(Category)` → extend any prompt/context switches in `services/geminiService.ts`.
- Add/rotate Gemini keys: Settings modal accepts newline-delimited keys; keys are stored locally and rotated via `apiKeyStore` helpers.
- Export/import progress: `Sidebar` export uses `JSON.stringify(exercises)` and import expects an `Exercise[]`.

Files to inspect first
- `App.tsx`, `types.ts`, `services/geminiService.ts`, `services/storage.ts`, `services/apiKeyStore.ts`, `services/monacoSetup.ts`, `components/Sidebar.tsx`, `components/ExerciseCard.tsx`, `components/SettingsModal.tsx`.

Notes for AI agents
- Be conservative editing the global app state — `App.tsx` coordinates most flows.
- Preserve the strict JSON response expectations in `geminiService.ts` (changes there affect generation/evaluation behavior across the app).
- Use the localStorage keys and events (`trimble_spark_trainer_v1`, `gemini:keyError`) when integrating with the UI.

If anything above is unclear or you'd like more examples (e.g., exact schema used by `generateExercise`), tell me which area to expand.
