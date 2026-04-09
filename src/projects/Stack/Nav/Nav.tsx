import React, { useEffect, useState } from 'react';
import ToggleField from '../../../components/ToggleField/ToggleField';
import Catalogue from '../NodeJS/React/Components/Catalogue';

interface NavProps {
  fieldContainer?: HTMLElement | null;
  portalTarget?: HTMLElement | null;
  setSelectedPath?: (name: string) => void;
}

const Nav: React.FC<NavProps> = ({ fieldContainer, portalTarget, setSelectedPath }) => {
  const [sliderPad, setSliderPad] = useState<HTMLElement | null>(null);
  const [portal, setPortal] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (fieldContainer) setSliderPad(fieldContainer);
  }, [fieldContainer]);

  useEffect(() => {
    if (portalTarget) setPortal(portalTarget);
  }, [portalTarget]);

  return (
    <div className="Field" id="Nav"
      style={{
        width: '100%',
        height: '100px',
        top: 0,
        backgroundColor: 'rgba(0, 128, 0, 0.44)',
        border: '3px solid white',
        boxSizing: 'border-box',
      }}
    >
      <ToggleField
        FieldLocation={portal || undefined}
        hideOnDesktop={true}
        mobileBreakpoint={768}
        FieldContent={
          <div
            className="ToggledCatalogueField"
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
            <Catalogue setSelectedPath={setSelectedPath} />
          </div>
        }
      />
    </div>
  );
};

export default Nav;