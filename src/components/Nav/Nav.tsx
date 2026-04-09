import React from 'react';
import ToggleField from '../ToggleField/ToggleField';
import MainMenu from '../../projects/MainPage/MainMenu/MainMenu';

import Catalogue from '../../projects/Stack/Components/Catalogue';

interface NavProps {
  fieldContainer?: HTMLElement | null;
}

const Nav: React.FC<NavProps> = ({ fieldContainer }) => {
  return (
    <div
      className="Nav"
      style={{
        width: '100%',
        height: '100px',
        backgroundColor: '#00800070',
        border: '3px solid white',
        boxSizing: 'border-box',
      }}
    >
      <ToggleField
        FieldLocation={fieldContainer}
        hideOnDesktop={true}
        mobileBreakpoint={768}
        FieldContent={
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '250px',
              height: '100%',
              backgroundColor: '#ffffff',
              zIndex: 999,
            }}
          >
            <MainMenu />
          </div>
        }
      />
    </div>
  );
};

export default Nav;