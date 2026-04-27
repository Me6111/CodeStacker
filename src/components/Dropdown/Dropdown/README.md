Component: Dropdown



Props: 

OpenMenu - default Click. Multiple choice allowed: 
- Click, Hover, 

CloseMenu - default ClickToggle. Multiple choice allowed:
- ClickToggle
- HoverToggle
- MouseLeave (particular toggle + optionslist object)
- ClickOption
- HoverOption


MenuPosition - Position of Menu in relation to the Toggle.
The latest opened Menu has higher z-index.
Default bottom. 
Several options:
- Top, bottom, left, right (if 00 has 'bottom' then its Menu with 000,001,002 overlaps 01,02 and everything below)
- inside (if 00 has 'inside' then its Menu with 000,001,002 is opened between 00 and 01)


Indentation - especially useful for MenuPosition inside. Default 15px

MultipleMenu - default false. Specified for a single dropdown element. Can a few dropdowns be opened within its optionslist. If false, then dropdown automatically closed if another is opened

RememberMenus - default true. It means that if 0, 01, and 011 opened, and 0 closed and then reopened - all Options on its OptionsList, which are dropdowns thmeselves which are opened will be remembered. So when 0 reopened - 01 which 011

OptionsMap - definition of the basic OptionsList and all the sub dropdowns and their subdropdowns and all optionslist etc.

OptionElement - on the OptionsMap every single element is the Option which has optional argument OptionElement. As default defined as minimalistic dark element. But it can be changed for anything else.
OptionsMap is an argument where it's possible to define every single option element individually.




Requirements:

- Created using component ToggleField, where Toggle is the option which expands list of options, and Field which is the list of options.

- Dropdown can use InputField component as the Toggle for example filtering among the options within its Field.
There is option to make the InputField to filter among the all sub dropdowns

- If InputField used it can inplace the chosen value in the InputField after selection. There should be an option to dynamically modify placeholder during hovering the options from the Menu. It should be possible to make 0 or 01's InputField to dynamically take value of the inner dropdown for example 01's input can take the value of the chosen subdropdown for example 0000

- The default Dropdown component has OptionsMap with option 0 which optionslist is 00,01,02 and each of them is a dropdown with own 3 options 000,001, 002 and they also are dropdowns until the fourth step 0000, 0001 etc.





Default Structure
The default dropdown generates a tree structure:
0
├── 00
│   ├── 000
│   │   ├── 0000
│   │   ├── 0001
│   │   └── 0002
│   ├── 001
│   │   ├── 0010
│   │   ├── 0011
│   │   └── 0012
│   └── 002
│       ├── 0020
│       ├── 0021
│       └── 0022
├── 01
│   └── ... (same pattern)
└── 02
    └── ... (same pattern)