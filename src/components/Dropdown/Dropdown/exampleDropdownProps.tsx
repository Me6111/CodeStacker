import React from 'react';
import Dropdown, { DropdownItem, DropdownProps } from './Dropdown';

const menuItems: DropdownItem = {
  label: 'Menu',
  optionsListPosition: 'bottom',
  Indentation: 'left, 20px',
  AllowMultipleMenusOpened: true,
  RememberOpenedMenus: true,
  children: [
    {
      label: 'Projects',
      optionsListPosition: 'inside',
      Indentation: 'left, 20px',
      AllowMultipleMenusOpened: true,
      RememberOpenedMenus: true,
      children: [
        {
          label: 'Project Management',
          optionsListPosition: 'inside',
          Indentation: 'left, 20px',
          AllowMultipleMenusOpened: true,
          RememberOpenedMenus: true,
          children: [
            { label: 'Create Project' },
            { label: 'Edit Project' },
            {
              label: 'Delete Project',
              optionsListPosition: 'inside',
              Indentation: 'left, 20px',
              AllowMultipleMenusOpened: false,
              RememberOpenedMenus: true,
              children: [
                { label: 'Permanent Delete' },
                { label: 'Soft Delete' }
              ]
            }
          ]
        }
      ]
    }
  ]
};

const SimpleDropdownOption: React.FC<{
  label: string;
  onClick?: () => void;
  isOpen?: boolean;
}> = ({ label, onClick }) => (
  <div onClick={onClick} style={{ padding: '8px 16px', cursor: 'pointer' }}>
    {label}
  </div>
);

export const exampleDropdownProps: DropdownProps = {
  triggerItem: menuItems,
  optionsListPosition: 'bottom',
  OpenMenu: ['click'],
  CloseMenu: ['click_option_again'],
  DropdownOption: SimpleDropdownOption,
};

export const ExampleDropdownInstance = (
  <Dropdown {...exampleDropdownProps} />
);
