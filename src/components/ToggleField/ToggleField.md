Component: ToggleField

Description:
Basic component for displaying fields with some content.

Props:
isOpened - as default false. There is visible only toggle which is opening/showing the field. Can be changed to true





Requirements:
Created of 2 elements: Toggle, and Field

Can be set up that Toggle for closing is within the Field

Also closing can happen not by a closing button/toggle but activating the same toggle

Closing toggle can be of the size of the whole screen and work as the background of the Field 

Closing toggle can be the opening toggle but after opening the opening toggle can change its style/size/position.etc. 








## Component: ToggleField

### Description

`ToggleField` is a flexible UI component used to show and hide content. It consists of a toggle control and a content field, allowing different interaction patterns for opening and closing the field.

---

### Props

* **isOpened** (`boolean`, default: `false`)
  Controls the initial visibility of the field.

  * `false`: Only the toggle is visible
  * `true`: The field is visible on initial render

---

### Structure

The component is composed of two main elements:

1. **Toggle**
   The interactive element that opens (and optionally closes) the field.

2. **Field**
   The container that holds and displays the content.

---

### Behavior & Configuration Options

The component is designed to be highly flexible. The following interaction patterns are supported:

#### Opening & Closing

* The same toggle can be used for both opening and closing the field.
* Alternatively, a separate closing toggle/button can be placed inside the field.

#### Toggle Placement

* The closing toggle can be:

  * Inside the field (e.g., a close button)
  * Outside the field (same as the opening toggle)

#### Dynamic Toggle Behavior

* The opening toggle can change after activation:

  * Style (e.g., color, icon)
  * Size
  * Position
  * Behavior (e.g., becomes a close button)

#### Background / Overlay Toggle

* A full-screen toggle can be used as a background overlay.

  * Clicking this background closes the field.
  * Useful for modal-like interactions.

---

### Summary

`ToggleField` is not a rigid component—it allows multiple UX patterns:

* Single toggle (open/close)
* Separate open and close controls
* Inline or overlay-based closing
* Dynamic toggle transformations

This makes it suitable for use cases like dropdowns, modals, expandable sections, and custom interactive panels.
