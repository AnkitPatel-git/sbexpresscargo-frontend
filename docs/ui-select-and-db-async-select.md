# Select & `DbAsyncSelect` — UI conventions (attach to agent)

This document describes how native **Radix `Select`** is wrapped in this repo (`src/components/ui/select.tsx`), how **`DbAsyncSelect`** behaves, and what to do if a screen still misbehaves (layout, scroll, truncation, dropdown position).

---

## 1. Shared `Select` / `SelectContent` / `SelectTrigger` (`select.tsx`)

### Defaults on `SelectContent`

- **`position="popper"`** — menu is positioned with Floating UI relative to the **trigger** (not “item-aligned” to text).
- **`side="bottom"`** — opens **below** the trigger.
- **`align="start"`** — aligns with the **start** of the trigger (typical for full-width fields).
- **`sideOffset={4}`** — small gap under the trigger.
- Popper content width: **`w-[var(--radix-select-trigger-width)]`** and **`min-w-[var(--radix-select-trigger-width)]`** so the panel matches the control width.

**Opt out** (rare): pass e.g. `position="item-aligned"` and/or `align="center"` on that `SelectContent` only.

### `SelectPrimitive.Content` shell

- Outer content: **`flex flex-col`**, **`max-h-[min(18rem,var(--radix-select-content-available-height))]`**, **`overflow-hidden`** (the **viewport** or an inner list scrolls, not the whole chrome in the default case).

### `SelectPrimitive.Viewport`

- Default (popper): scrollable list area with **`overflow-y-auto`**, max height, **`onScroll`** supported for infinite lists.
- Optional **`viewportClassName`** — merged **after** defaults. Used by **`DbAsyncSelect`** to set **`overflow-hidden` + flex column** so only an **inner** div scrolls (see below).

### `SelectTrigger`

- **`w-full min-w-0 max-w-full`** — trigger does not grow past its container.
- Selected text: **`truncate`** on the value slot (`min-w-0 flex-1 truncate text-left`).
- Chevron: **`shrink-0`**.

**Compact / shrink-wrapped trigger:** pass e.g. **`className="w-fit max-w-none"`** on `SelectTrigger` to override defaults.

### `SelectItem`

- Row: **`min-w-0 w-full`** on the item.
- **`SelectPrimitive.ItemText`**: **`min-w-0 flex-1 truncate text-left`** so long option labels ellipsize in the dropdown.

### `forwardRef` on `SelectContent`

- Ref is attached to **`SelectPrimitive.Viewport`** (the scroll surface for normal selects), not the outer content node.

---

## 2. `DbAsyncSelect` (`src/components/ui/db-async-select.tsx`)

Server-backed single select: debounced search, fixed page size, load more on scroll + intersection when the first page does not create a scrollbar.

### Layout

- Root wrapper: **`min-w-0 w-full max-w-full`** around `<Select>` so grid/flex parents can shrink the control.
- **`SelectContent`** uses **`viewportClassName="flex min-h-0 flex-1 flex-col overflow-hidden p-0"`** so the **viewport does not scroll**; instead:
  - **Top:** fixed search strip (`shrink-0`), with pointer/key handling so Radix does not steal focus from the search input.
  - **Bottom:** inner **`div`** with **`ref`**, **`overflow-y-auto`**, **`onScroll`** for infinite scroll + **`IntersectionObserver`** sentinel when `hasNextPage` and the list is shorter than the panel.

### Positioning / width

- Inherits global **`SelectContent`** popper defaults (no need to repeat `position` / `side` / `align` / `sideOffset` unless overriding).
- Optional **`contentClassName`** for local tweaks.

### API contract for `fetchPage`

- Use **`limit: DB_ASYNC_SELECT_PAGE_SIZE`** (same as hook page size).
- Return shape compatible with infinite query: **`data`**, plus either **`meta: { page, totalPages }`** or top-level **`page` / `totalPages`** (e.g. zone list API).

---

## 3. Form / floating layout (truncation & grids)

### `FormControl` (`src/components/ui/form.tsx`)

- **`min-w-0`** on the control slot so flex/grid children can shrink below intrinsic text width.

### `FLOATING_INNER_CONTROL` / outlined shells (`floating-form-item.tsx`)

- **`min-w-0`** on **`FLOATING_INNER_CONTROL`** (and therefore **`FLOATING_INNER_SELECT_TRIGGER`** / combo).
- **`min-w-0`** on the **outlined field surface** and on **`OutlinedFormSection`** inner content wrapper.

### Grids that contain selects

If a column still expands with long selected text:

- Put **`min-w-0`** on the grid and/or **`[&>*]:min-w-0`** on direct children (see **`rate-form`** route slab editor grid and master tab grid).

---

## 4. Infinite scroll hook (`use-infinite-entity-list.ts`)

- **`useSelectContentInfiniteScroll`**: attach returned handler to **`SelectContent` `onScroll`** (wired to **viewport** in `select.tsx`). Fires near bottom of the scroll container.
- **`useIntersectLoadMoreInScrollRoot`**: use when the scroll root is an **inner** element (e.g. `DbAsyncSelect` list `div`) and the first page may not produce a scrollbar; **`root`** = that scroll element, **`sentinel`** = small element at list bottom.

---

## 5. What is *not* covered here

- **`MultiSelect`** (`Popover` + `cmdk` `CommandList`) is a different component; scrolling/search patterns differ.

---

## 6. Quick troubleshooting

| Symptom | Things to check |
|--------|-------------------|
| Menu opens in wrong place | Should be rare with default **popper** + **bottom**; override `position` / `side` / `align` on that `SelectContent` if needed. |
| Whole panel scrolls including search (`DbAsyncSelect`) | Ensure **`viewportClassName`** + inner scroll **`div`** pattern is intact. |
| No “load more” / no scroll | **`getNextPageParam`** / API **`totalPages`**; **`useIntersectLoadMoreInScrollRoot`** + sentinel on short first page. |
| Trigger grows with long value | **`min-w-0`** on parents (`FormControl`, grid, outlined shell); **`SelectTrigger`** defaults **`truncate`**. |
| Dropdown rows overflow | **`SelectItem`** / **`ItemText`** truncation in **`select.tsx`**. |

---

*Last aligned with the “customer rate master / zone select” work: popper below trigger, inner list scroll for async select, truncation, `min-w-0` chain, global `SelectContent` defaults.*
