You are updating the Content module in a React frontend based ONLY on the Bruno collection in `docs/bruno`.

Rules:

* Bruno collection is the single source of truth for APIs.
* Do NOT assume APIs outside Bruno.
* Work ONLY on the given module.
* Do NOT modify unrelated files.
* Keep code minimal and production-ready.
* Reuse existing services/hooks if available.
* If missing, create clean API service functions.
* Use existing project patterns (axios, hooks, state, etc).
* Keep list filters out of the main page body unless the design explicitly needs inline filtering.
* Put filters behind a toolbar filter icon that opens a popup, dialog, or sheet.
* The popup should contain the filter fields plus `Apply` and `Reset` actions.
* The list should load default data first and only apply filters after the user confirms them.
* Place primary actions like `Create` on one side of the toolbar and utility actions like filter, export, and refresh on the other side.
* For searchable selection dropdowns, load only a small default page size (prefer `limit: 10`) and use API search when the user types instead of preloading the full list.
* Selection fields must not grow wider because the selected value is long; keep the control width fixed and truncate or clip the visible value inside the box.

Task:
Implement ALL APIs for: `content`

Bruno source for this module:

* `docs/bruno/master/content/folder.yml`
* `docs/bruno/master/content/GET -api-content-master.yml`
* `docs/bruno/master/content/GET -api-content-master--id.yml`
* `docs/bruno/master/content/POST -api-content-master.yml`
* `docs/bruno/master/content/PUT -api-content-master--id.yml`
* `docs/bruno/master/content/DELETE -api-content-master--id.yml`
* `docs/bruno/master/content/GET -api-content-master-export.yml`

For each API in this module:

1. Add or update API call
2. Connect UI (form/list/detail/actions)
3. Handle loading + error states (minimal)
4. Ensure correct request/response mapping
5. Add missing fields in UI if required

Output format (STRICT):

1. Files changed (list)
2. Code changes (only final code, no explanation)

Constraints:

* No explanations
* No comments except necessary
* No console.logs
* No placeholder code
* No duplicate logic
* Keep responses short

If something is unclear:

* Infer from Bruno example ONLY
* Do NOT ask questions

Goal:
Fully working module aligned with backend APIs.

Integration guardrails:

* Use Bruno absolute API paths exactly as defined for every endpoint.
* Verify related lookup endpoints from Bruno instead of inferring them from existing frontend code.
* Preserve Bruno request and response field names exactly; do not invent or rename fields unless the UI layer explicitly requires mapping.
* Do not render list columns, filters, detail rows, or badges for fields that are not present in the module's Bruno GET/list responses.
* Do not render form fields or sections unless those fields exist in the module's Bruno POST/PUT bodies or GET-by-id response for edit display.
* Remove display-only helper fields before submit; final payloads must contain only Bruno-supported request properties.
* Respect backend query constraints from Bruno or backend behavior, especially `limit`, pagination, sorting, and search parameters.
* If the backend rejects large `limit` values, keep requests within the supported cap.
* Do not reuse unrelated RBAC permissions from another module; wire permissions that match the current module.
* Reuse existing shared API helpers, auth headers, hooks, and state patterns where possible.
* Handle backend error messages cleanly and surface useful API failures in the UI.
* Keep lookup dropdowns lightweight; do not preload large datasets if pagination or search already exists.
* For option fields, prefer backend pagination/search over loading all rows and filtering in the browser.
* Option search should use DB/API search whenever the backend supports `search`.
* Prefer fetch-on-open or debounced async lookup patterns for searchable option fields.
* For dependent option fields, pass parent filters to the backend where available, e.g. country, state, type, status.
* Avoid unrelated file changes; keep the work scoped to the target module unless a shared dependency is required for correctness.
* If a module uses tabbed forms, map each tab to the Bruno-backed section or child API it represents; do not leave visual placeholder tabs without integrating the real API.
* In tabbed forms, keep the primary module fields in their own logical tab and move child collections or related APIs into separate tabs only when Bruno supports them.
* For child API tabs, support the real backend flow: list, add, edit, and delete when those APIs exist in Bruno.
* In create mode, child API tabs should stay disabled or show a clear create-first state until the parent record exists.
* Keep tab navigation explicit with `Previous` and `Next` buttons when the form is meant to behave like a step flow.
* In tabbed forms, keep the action bar right-aligned.
* In tabbed forms, use `Cancel` as a destructive red action and `Create` or `Update` as a success green action.
* On the first tab, show `Cancel`, then `Create` or `Update`, then `Next`.
* On middle tabs, show `Previous`, then `Create` or `Update`, then `Next`.
* On the last tab, show `Previous`, then `Create` or `Update`; do not show `Next`.
