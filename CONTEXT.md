# Project Context

## TanStack Query Mutation Handling Convention

- Global mutation errors are handled in `queryClient` (`src/services/api/TanstackQueryProvider.tsx`) via `defaultOptions.mutations.onError`.
- The global handler reads Axios error payloads (`ServerErrorResponse`) and displays toast messages.
- Feature/page-level mutation calls should follow the `mutateAsync` pattern used in `onSignUpSubmit` in `src/features/auth/ui/pages/AuthPage.tsx`.
- For success UX, follow the existing mutation-hook pattern (for example `useRegister` in `src/features/auth/api/index.ts`) where `onSuccess` can toast with `data.message`.
- Per-call `mutateAsync` callbacks can still be used for page-specific behavior (navigation, reset, UI toggles) when needed.
- Do not duplicate generic toast error handling in each mutation call when global `onError` already covers it.

## Form Handling Convention

- Use `react-hook-form` for form state/submit handling across the project.
- Use `zod` schemas for validation rules, with `zodResolver` integration.
- Prefer schema-driven validation over manual `if`/`else` checks in submit handlers.
- Minimize `useState` for form fields when `react-hook-form` can own the state.
- Keep forms concise by colocating:
  - schema definition
  - inferred form type (`z.infer<typeof schema>`)
  - `useForm` setup with `defaultValues`
- For submission, use `handleSubmit` + async handlers, and connect API calls through TanStack Query mutations.
- Always submit through `handleSubmit(onValidSubmit)` so Zod validation gates execution.
- If required/missing fields fail Zod validation, the submit handler (`onValidSubmit`) must not run.
- shadcn/ui is installed — always use its components (`Input`, `Button`, `Label`, `Select`, `Checkbox`, `InputOTP`, etc.) for form fields instead of raw HTML elements.
- For custom/non-native inputs (shadcn `Select`, `Checkbox`, `InputOTP`, etc.), use `Controller` from `react-hook-form` to integrate them since they don't support `register` directly.
- For standard text/email/password inputs rendered as native `<input>`, use `register` directly on the shadcn `Input` component.

## Shared Button Loading Convention

- The shared shadcn `Button` in `src/components/ui/button.tsx` supports `ButtonProps.isLoading?: boolean`.
- When using the shared `Button` for async submit/action states, pass the controlling boolean (`isPending`, `isSubmitting`, `saving`, etc.) through `isLoading`.
- `isLoading={true}` is responsible for the loading UI and also disables the shared `Button` while the async action is in progress.
- Do not manually render spinner/loading UI inside the shared `Button` for standard loading states; let the component handle that behavior.
- Do not duplicate `disabled={isLoading}` on the shared `Button`, since the component already disables itself while loading.
- Keep separate `disabled` conditions only for non-loading constraints such as invalid form state, missing required selections, or permission/role guards.
- This convention applies to the shared shadcn `Button` only, not to raw HTML `<button>` elements or non-button loading indicators.

## UI Copy Extraction Convention

- When asked to copy UI from one file to another, preserve the visual structure and interaction shape, not the source file's business logic or data layer.
- Rebuild the target inside the destination feature with feature-local components, types, constants, and orchestration instead of importing demo/mock hooks into main-app feature code.
- Make the copied UI work independently by default using local UI state or placeholders when backend/API wiring is not ready.
- Centralize state transitions and draft shaping in one feature-local orchestration layer so future API integration can replace local actions without rewriting presentational components.
- Break the copied UI into focused components and keep prop drilling shallow: one level preferred, two levels maximum.
- Prefer UI-only local types/constants when the source and target files belong to different logic layers or architectures.
- When copying table-display UI, use `src/components/ui/data-table.tsx` instead of hardcoded `<table>` markup.
- Always wire table loading and no-results UX through `DataTable` props (`isLoading`, `noResultStatement`) rather than custom conditional wrappers around table markup.
- Preserve source-table visual structure in the target feature, but keep the target independent by using placeholders for fields/actions that are not yet available in that feature's data layer.

## API Response Contract Convention

- Use the shared Axios instance from `src/shared/axios-instance.tsx`.
- Model success responses with `ServerSuccessResponse<T>`:
  - `status: true`
  - `message: string`
  - `data: T`
- Model error responses with `ServerErrorResponse`:
  - `status: false`
  - `message: string`
- Type mutation/query Axios calls with these wrappers so UI logic can rely on consistent `message` and `data` fields.
- Use server-provided `message` for user-facing toasts where applicable (especially in mutation success handlers).

## System Migration Convention (Supabase -> Backend Service)

- The project is migrating the entire app away from Supabase backend services to a separate backend service.
- Existing Supabase integrations are legacy compatibility paths and should not be expanded for new feature work.
- For new modules and refactors, prefer backend endpoints via Axios + TanStack Query.
- Data access, mutations, and validation flows should align with shared API contracts (`ServerSuccessResponse<T>`, `ServerErrorResponse`) and query/mutation conventions in this context file.
- When touching legacy Supabase code, prefer migration-safe changes that move behavior toward the backend service model.

## Feature-First Architecture Convention

- Use feature-based ownership: each feature is responsible for its own UI, API calls, domain models, orchestration, and utilities.
- Place feature-specific API hooks/types under that feature, not under global services.
- Preferred feature structure (use what is needed per feature):
  - `components/`
  - `api/`
  - `pages/`
  - `layout/`
  - `provider/`
  - `composable/`
  - `util/`
- For example, auth API hooks/types should live in `src/features/auth/api/`.
- API folder structure convention:
  - `api/index.ts`: exports TanStack Query hooks (queries/mutations) and query options.
  - `api/requests.ts`: contains pure request functions that call server endpoints via Axios.
  - `api/types.ts`: contains request/response DTO types used by requests/hooks.
- Keep `index.ts` focused on query orchestration and side-effects (for example toasts, token writes), while `requests.ts` stays transport-focused.
- Keep shared cross-feature infrastructure in shared locations (for example Axios instance, Query provider, global providers, shared libs/components).
- For new features, start from feature-local folders first; only promote to shared modules when multiple features need the same behavior.

## Auth-Specific Migration Rules

- New auth flows should use backend endpoints via Axios + TanStack Query hooks.
- Sign-in responses should store `accessToken` and `refreshToken` in `useAuthStore`.
- `useAuthStore` is the source of truth for tokens and should persist them to `localStorage` via Zustand `persist` middleware.
- `isAuthenticated` must be derived from token presence (`accessToken` + `refreshToken`), not from Supabase session existence.
