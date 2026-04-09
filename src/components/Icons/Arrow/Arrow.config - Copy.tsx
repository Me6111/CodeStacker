import React, { useState } from 'react';
import Arrow from './Arrow';
import ArrowSourceCodeRaw from './Arrow.tsx?raw';

const scales = [0.5, 1, 1.5, 2, 3, 4, 5];

const ArrowWrapper: React.FC = () => {
  const [focused, setFocused] = useState(false);
  const [otherClicked, setOtherClicked] = useState(false);
  const [otherHovered, setOtherHovered] = useState(false);
  const [parentHovered, setParentHovered] = useState(false);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', backgroundColor: '#121212', padding: '40px 0' }}>
      <div style={{ display: 'flex', overflowX: 'auto', gap: '30px', width: '90vw' }}>
        
        <div style={{ minWidth: '400px', padding: '20px', borderRadius: '10px', backgroundColor: '#1e1e1e', color: '#fff', flexShrink: 0 }}>
          <h3>Arrow 1 - Focus/Click</h3>
          <p>Changes all properties when focused or clicked.</p>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {scales.map((scale, idx) => (
              <div key={idx} tabIndex={0} onClick={() => setFocused(!focused)} style={{ outline: 'none' }}>
                <Arrow
                  width={25 * scale}
                  height={10 * scale}
                  notch={5 * scale}
                  rotate={focused ? 0 : -90}
                  strokeWidth={focused ? 1.5 : 1}
                  strokeColor={focused ? 'white' : 'grey'}
                  fillColor={focused ? 'grey' : 'none'}
                  transition={0.5}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{ minWidth: '400px', padding: '20px', borderRadius: '10px', backgroundColor: '#1e1e1e', color: '#fff', flexShrink: 0 }}>
          <h3>Arrow 2 - Other Component Click</h3>
          <p>Changes all properties when another component is clicked.</p>
          <button onClick={() => setOtherClicked(!otherClicked)} style={{ marginBottom: '10px', padding: '5px 10px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '5px' }}>
            Toggle Click
          </button>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {scales.map((scale, idx) => (
              <Arrow
                key={idx}
                width={20 * scale}
                height={8 * scale}
                notch={2 * scale}
                rotate={otherClicked ? 45 : 0}
                strokeWidth={otherClicked ? 1 : 0.5}
                strokeColor={otherClicked ? 'cyan' : 'blue'}
                fillColor={otherClicked ? 'grey' : 'none'}
                transition={0.3}
              />
            ))}
          </div>
        </div>

        <div style={{ minWidth: '400px', padding: '20px', borderRadius: '10px', backgroundColor: '#1e1e1e', color: '#fff', flexShrink: 0 }}>
          <h3>Arrow 3 - Other Component Hover</h3>
          <p>Changes all properties when another component is hovered.</p>
          <div
            onMouseEnter={() => setOtherHovered(true)}
            onMouseLeave={() => setOtherHovered(false)}
            style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
          >
            {scales.map((scale, idx) => (
              <Arrow
                key={idx}
                width={22 * scale}
                height={9 * scale}
                notch={3 * scale}
                rotate={otherHovered ? 30 : 15}
                strokeWidth={otherHovered ? 1.2 : 0.8}
                strokeColor={otherHovered ? 'magenta' : 'brown'}
                fillColor={otherHovered ? 'grey' : 'none'}
                transition={0.4}
              />
            ))}
          </div>
        </div>

        <div
          onMouseEnter={() => setParentHovered(true)}
          onMouseLeave={() => setParentHovered(false)}
          style={{ minWidth: '400px', padding: '20px', borderRadius: '10px', backgroundColor: '#1e1e1e', color: '#fff', flexShrink: 0 }}
        >
          <h3>Arrow 4 - Parent Hover</h3>
          <p>Changes all properties when parent component is hovered.</p>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {scales.map((scale, idx) => (
              <Arrow
                key={idx}
                width={20 * scale}
                height={8 * scale}
                notch={2 * scale}
                rotate={parentHovered ? -45 : 0}
                strokeWidth={parentHovered ? 1.3 : 0.7}
                strokeColor={parentHovered ? 'orange' : 'white'}
                fillColor={parentHovered ? 'grey' : 'none'}
                transition={0.5}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

const Arrow_Config = {
  key: 'Arrow',
  Name: 'Arrow',
  ComponentUsageCodeRaw: '',
  ComponentDefinitionCodeRaw: ArrowSourceCodeRaw,
  ComponentInstance: <ArrowWrapper />,
  dependencies: { React, Arrow },
};

export default Arrow_Config;
