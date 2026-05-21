SVGcreator

The react component tool for creating SVG objects

Tool provides functionalities enabling to create:
- complex shapes
- editing these shapes afterwards



It consists of:

> Board 
The Board contains the preview of the created shape. 
Allows to create and modifies shapes


> CodePreview
Preview for the code of the entire svg object


> Undo, Redo buttons
Look like left, right arrows in the corner.


> Tools/functionalities used for modifying existing shapes:
- Hover/highlight
the hovered lines and points are highlighted which enables the easier selection

- Select 
After single click it selects the highlighted lines or points 

- Split
For adding a new point/corner to a line 
- Measure/Ruler (for finding the center o the proportions)
When line is hovered, there is visible a line cutting the hovered line in the center
showing where is the center. On both sides are the numbers showing proportions which 
proportions values are changing when cursor is moving through different place on the line

> EditName 
For the elements within ObjectMap.
Every element's name within ObjectMap has a small icon EditName. 
SVG, Polygons, etc. They have default names but they can be changed

> Select
Select is a shape itself. Can be applied separately fore each ObjectMap's element without interferring withThere are options of 
what shape Select area is supposed to be:

- point and line
Select options: 
- square
- free-form
And for each option there is checkbox. Possible both to choose 
- select only lines
- select only points 

All selection tools should share the same interaction and behavior model. The only difference between tools should be the drawing method and the final shape geometry (polygon, rectangle, free-form, etc.). Once created, every selection object must behave identically.

Each selection object consists of two separate shapes:

* the actual selection shape
* the selection container shape

The actual selection shape is the real geometry drawn by the user, such as a polygon, free-form shape, or rectangle.

The actual selection shape should have:

* a thin dashed outline
* no visible corner handles by default
* corner points appearing only on hover
* no fill color inside the shape

Hover interactions:

* hovering a line displays a small perpendicular line icon with arrow endings, indicating line movement
* hovering a corner displays a crossed-arrows icon, indicating point movement

The selection container is the rectangular boundary in which the actual selection shape is inscribed.

The role of the selection container is to resize the actual selection shape by controlling its total width and height.

The selection container should have:

* a normal thin border
* corner hover interactions displaying the crossed-arrows icon
* border hover interactions displaying the perpendicular arrows-line icon

There are two interaction indicator icons:

* point movement indicator
* line movement indicator

These should be implemented as separate reusable UI components.

Behavior rules:

* when a point is moved, the two connected lines automatically adjust to the new point position
* when a line is moved, its connected points automatically update their positions accordingly

The selection shape system should be implemented as a separate reusable component architecture shared by all selection tools.



> Select Tool's tools.
In the right corner of the select's shape container should be the list of options.
SelectTools are wrapped as icons in the small container next to the select shape container
SelectTools:
- ThrashBin button. Select shape is not supposed to disappear when click outside. 
There can be a several selects opened at the same time
Each can be deleted when clicked ThrashBin button.
- ElementsToSelect
List of 2 checkboxes to choose, possible both to select. Lines and points.


















it is attracted too much. i want it require closer distance of the cursor from half point line. now i'm not able to cut line very close to cut point line because it is attracting it too strongly. 

the second problem is that half point line and cursor has to be parpenicular to the hovered line. it's clear if the line on the screen is horizontal but what if the hovered line is vertical? the half point line and cursor also is vertical and very difficult to see. 

write full corrected file with no comments




scum what if i will create a few polygon objects. the code has to be able to manage a few objects. each object can have own 'move' option so they can be located on the different parts of the screen. select should work first for different polygon objects. then if a polygon object is selected then its elements like lines and points can be selected and modified using move or split. write full corrected code with no comments



Scum. Below code works properly except of:
- move line tool 
(it's not working. when line is moved its points are remaining the same distance between each other/line length
but the line can be movable in any different place - )





- Move 
For both 








