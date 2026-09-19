---
version: alpha
name: Frame Studio
description: A structural drafting desk with synchronized work planes and spatial views.
colors:
  primary: "#437653"
  primaryLight: "#d9efdf"
  primaryDark: "#28563a"
  surface: "#ffffff"
  background: "#f0f6f1"
  ink: "#263b2d"
  success: "#33734b"
  danger: "#b63f52"
typography:
  sans:
    fontFamily: 'Roboto, Helvetica, Arial, sans-serif'
  mono:
    fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace'
rounded:
  DEFAULT: "10px"
  small: "6px"
spacing:
  unit: "4px"
  inspector: "380px"
components:
  button:
    rounded: "{rounded.small}"
    backgroundColor: "{colors.primaryLight}"
    textColor: "{colors.primaryDark}"
  panel:
    rounded: "0px"
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink}"
  support:
    textColor: "{colors.success}"
  load:
    textColor: "{colors.danger}"
---

# Frame Studio design system

## Overview

Product register. Structural engineers construct and inspect line-frame models at a desktop drafting desk. The reference is an engineering analysis workbench, specifically SAP2000's plane/coordinate modeling workflow, rather than a marketing dashboard. The signature is one highlighted work plane that appears simultaneously as an editable elevation/plan and a translucent plane in a spatial wireframe.

The existing English interface remains the language policy. There is no Japan-market scope. Numeric inputs use decimal points and explicit engineering units. API invariants in docs/FRAME3D_MATH_CORE.md own mathematical behavior.

Runtime ownership: frontend/src/theme.ts is the canonical MUI palette/type/shape source; this document mirrors it. frontend/src/styles.css owns the legacy application styles. frontend/src/spatial/spatial.css consumes MUI variables and owns drafting geometry and scroll tokens. No new UI library or font source.

## Colors

Light sage fills selected tools, primary actions and drafting surfaces, with dark green text and linework. White definition cards share the same borders and spacing in 2D and 3D. Green marks selected objects, supports and successful analysis; red marks applied loads, results and errors. Result overlays carry a label and scale. Axes are labeled X/Y/Z as well as colored. Color alone never carries status.

## Typography

Roboto is the established UI family. Headings are restrained 16–18px/600. Controls and dense tables use 12–14px. Coordinates, member IDs and result values use tabular numerals and monospace utility text. No decorative display type in the modeling workspace.

## Layout

64px top bar with 2D/3D switch at the left, followed by a compact model toolbar. A shared 88px tool rail (64px on phones), 380px inspector (360px on smaller desktops) and remaining canvas form the desktop shell. The inspector scrolls independently; tables have their own bounded scroll and pagination. At widths below 1050px the 3D inspector becomes an app-owned drawer. The 2D phone inspector occupies a bounded, independently scrollable area beneath the canvas. Below 700px the split 3D canvas resolves to one plane, with spatial view available by its labeled toggle. Toolbars wrap without hiding essential actions. The application owns viewport scrolling; this is a deliberate CAD workspace, not a document page.

## Elevation & Depth

Flat canvas panels use borders. Shadows are reserved for dialogs, menus and the mobile inspector. Member depth is indicated through projection and draw order; no decorative glass cards.

## Shapes

The shared MUI 10px radius remains canonical. Dense drafting controls use the explicit small 6px variant. Canvas dividers and data rows remain straight.

## Components

MUI Button, ToggleButtonGroup, TextField/Select, Dialog, Drawer, Tooltip, Alert and Snackbar own interactions. ToolRail, BrandMark, LibraryHeader and ElementAssignmentPanel own the common 2D/3D visual language. DimensionSwitch and ConfirmProvider are also shared; 3D NumericForm uses the same library definition rows and assignment cards as 2D. Double-clicking Select toggles the inspector; choosing another modeling tool opens it. The collapsed desktop strip is 56px wide and provides an accessible reopen button. Hover, focus-visible, selected and disabled states remain visible. All icon buttons carry tooltips and accessible labels. Save/analysis busy states retain button size.

Material and Section are separate tools. Each has an explicit Apply to elements module. 3D supports one element, the selection, or all elements; Use for new elements changes drawing defaults. Material edits only E/G and Section edits only A/Iy/Iz/J/Asy/Asz. Beam theory, orientation and releases have a separate action in the Section options accordion.

Coordinate forms are the keyboard alternative to pointer drawing. Rotate, tilt, zoom and fit buttons plus arrow-key panning are alternatives to dragging. Object tables provide keyboard-accessible selection. Undo/redo recovers the last 50 in-session model edits. Deletion and replacement use app dialogs.

Motion is restricted to brief MUI feedback; reduced motion disables incidental transitions. Model/camera motion directly follows input. Results include numeric tables beside graphic overlays and expose units and deformation/diagram scales.

## Do's and Don'ts

- Keep the plane offset, units and current drawing mode continuously visible.
- Keep 2D and 3D models independent when switching; never flatten a spatial model silently.
- Clear or cancel stale analysis on any numerical model edit.
- Never imply a drawn crossing is connected unless a joint is created there.
- Never replace an existing model through import before validating the file and confirming replacement.
