The first thing to understand are the terminology used by the application.
The key concepts:
> svg - the entire object, can be made of a few polygons 
> polygon - the single shape within an object
> point - the x,y coordinate saying where the two lines are connected
> line - the connection between 2 points

The Polygon's starting point is connected to its last point
which means that Polygon has to create a closed shape. 



The elements of the SVGcreator application:
> CodePreview - the field with the entire actual code of the svg currently visible on the Board
> Board - initially empty. Waits for the first point to be placed and created point after point
> ObjectMap - the Navbar showing dependencies of objects.
> ToolBar - depending on selected object there are different edit tools

There are different types of tools in ToolBar
Some of them are applicable for all the types of the elements, some only to specific

Tools for the entire SVG object:
> undo/redo arrows buttons 
> select - rectangle, free-form, all(Board as a rectangle), polygon

ObjectMap - Navbar with the list of all one-below level objects of which the object consists:
Dropdown with polygons. Once polygon selected, opened menu with toggle switching between 2 lists of options: all lines (default), all points
Svg - list of polygons. Polygon selected: 2 options to choose: list of all lines or all points

Tools for the selected polygon object:
> undo/redo arrows buttons (SVG undo redo is for entire svg, polygons are only for the specific polygon)
> select - rectangle, free-form, all(Board as a rectangle), point, line
> move 
> rotate 

Tools for the selected line object:
> move 
> rotate
> split/cut/add a new point

Tools for the selected point object: 
> move

Tool select has to be configured when used option rectangle or free-form
Points, Lines - checkbox next to each.




further explanation of some of the above functionalities/tools:

All objects: polygon, line, point are connected in all 3 containers: ObjectMap, Board, CodeEditor.
If any object hovered or selected in one container - it's automatically highlighted in the other two

UndoRedo can be for the entire svg, listing all changes within all polygons. But also the individual selected polygon objects have their own UndoRedo undoing and redoing changes only within themselves.



Look at below requirements.md and the code and correct description to exacty reflect the code, that when code deleted there is going to be generated exactly the same program using only description.
Write all the differences between description and code - things which description has but are not in the code. And the things which code has but are not in description.







fucking scum asshole you're getting yourself lost in writing this amazing and extremely useful program.

explanation for the question:

how to organize such a file to make it easy maintainable??


should there be only 




