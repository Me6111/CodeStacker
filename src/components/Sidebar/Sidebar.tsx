import React, { useState } from 'react';

const Sidebar = ({
  Style__Sidebar_Field,
  Style__Sidebar_FieldOpened,
  Style__Sidebar_FieldClosed,
  Style__Sidebar_Button,
  content,
  OpenButton = false,
  Opened = false,
  ButtonElement = null,
}) => {
  const [opened, setOpened] = useState(Opened);

  return (
    <div className="Sidebar" style={{ position: 'fixed' }}>
      {OpenButton && (
        <div
          className="Sidebar_Button"
          style={{
            width: '50px',
            height: '50px',
            position: 'relative',
            zIndex: 1000,
            pointerEvents: 'all',
            cursor: 'pointer',
            ...Style__Sidebar_Button,
          }}
          onClick={() => setOpened(!opened)}
        >
          {ButtonElement || <div style={{ width: '100%', height: '100%', backgroundColor: 'white' }} />}
        </div>
      )}
      <div
        className="Sidebar_Field"
        style={{
          backgroundColor: 'green',

          pointerEvents: 'all',
          overflow: 'hidden',
          ...Style__Sidebar_Field,
          ...(opened ? Style__Sidebar_FieldOpened : Style__Sidebar_FieldClosed),
        }}
      >
        {content}
      </div>
    </div>
  );
};

export default Sidebar;
