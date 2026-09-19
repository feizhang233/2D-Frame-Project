# Frame Studio interaction contract

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Table Selection | MUI Checkbox + spatial selection state | This contract | node/member, page-local | Domain tests and browser |
| Select/Listbox | MUI TextField select / MenuItem | theme.ts | authored 3D; existing native 2D properties | Keyboard/popup browser |
| Form | NumericForm + shared library rows + domain validation | frame3d backend and spatial model | coordinates / assignment / settings | Invalid and success browser |
| Scrollbar | spatial.css drafting baseline; styles.css for legacy 2D | DESIGN.md | stable gutter in inspector and tables | Computed styles |
| Toast | MUI Snackbar + Alert | This contract | success/info/warning/error | Browser live status |
| CRUD | SpatialWorkbench + model.ts transactions | This contract | undoable model edits; confirmed replacement | Model tests and browser |
| Dialog | ConfirmProvider + MUI Dialog | This contract | destructive / replace | Escape and focus restoration |

## State and persistence

Dimension switching preserves both mounted workspaces and does not convert geometry. Only the active workspace handles shortcuts or displays overlays. 3D is a local-file modeling workspace: JSON Open/Export is independent of existing authenticated 2D cloud Save. No new account policy is inferred. A visible draft status reports local browser persistence and storage failures. Export captures the complete 3D model; import validates before replacement. In-session undo includes deletion, import and new model.

Model IDs are stable except node deletion requires contiguous remapping for the backend. All references remap together. Geometric duplicate nodes are reused. Drawing across existing nodes or intersecting members creates connected subdivisions; distributed loads interpolate onto subdivided members, and releases remain at original ends.

Any numerical edit cancels analysis and clears results. A response can commit only if its abort controller and model revision are still current. Cancel/retry and errors remain visible beside the run action. API errors preserve the model.

## Drafting

Select and Draw are distinct. N adds nodes, E draws a continuous member chain, V/Escape selects, right-click ends the current chain. Shift-click extends selection. Plane coordinates are XY@Z, XZ@Y or YZ@X. Snap only affects pointer drafting; entered coordinates remain exact. Orbit is a spatial-view gesture; plan view pans. Camera buttons provide non-drag alternatives.

Material (M) and Section (C) are independent tools using the shared ElementAssignmentPanel. A 3D definition can apply to one element, selected elements, or all elements. Use for new elements changes only the relevant drawing defaults, even while objects are selected. E/G assignment preserves section, orientation, theory and releases; section assignment preserves E/G and element options. Formulation/orientation/release options have their own explicit action. Invalid numeric drafts stay visible and cannot partially apply. Double-clicking Select hides/shows Properties; another modeling tool reopens it, and the collapsed strip provides a keyboard-accessible reopen button. Support presets and six prescribed DOFs apply to selected nodes. Nodal forces/moments are global; distributed force coordinates are selectable, and mx is always local as defined by the backend. Timoshenko line loads are rejected before solve.

## Feedback and accessibility

English is the active interface locale. MUI authored selects own popup geometry and keyboard behavior. Forms use noValidate with field-associated textual errors, preserve invalid drafts and focus the first invalid field. IME input never triggers shortcuts/submission. A shared app-owned confirmation replaces native confirm. Status uses a polite live region; critical errors also remain inline. All controls retain hover/focus/disabled/busy states.

## Tables and view state

Object and result tables are paged (20 rows), with bounded internal scroll. Selection is model-wide and disclosed by counts; row checkboxes add or remove individual objects. Pagination clamps after deletion. Drafting is a local transient workspace, so table pages, camera and plane controls are held in component state rather than shareable URLs. The selected dimension and model draft use separate browser keys. No data is transmitted by changing views.

## Legacy migration boundary

Existing 2D material/section native selects retain their platform popup behavior; new authored 3D selects use MUI. Shared shell confirmations are migrated in this change. Existing 2D mathematical workflows and account saving remain intact; the new feature does not rewrite their reducers.
