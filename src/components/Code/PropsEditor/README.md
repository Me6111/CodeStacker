
Component: PropsEditor



Requirements:

- Built using Dropdown, Inputfield and CodeBit components

- Takes the whole component definition as the Argument and presents all the Props as InputFields with labels CodeBit with name of the prop

- Each prop has its own InputField, some of them can have value adjusters if they're code or number or string. Depending on the value type, there is automatically assigned ValueAdjuster in the InputField 

- The basic component is InputField but if there are a few options then there is used Dropdown with inputfield for filtering

- PropsEditor presents the current values of the props of the component rendered in RenderPreview. As default they're as in component definition, but all the values are updated dynamically at the same time between - renderPreview, PropsEditor and CodeEditor.




