import React from 'react';

interface ComponentShowcaseProps {
  componentName: string | null;
}

const ComponentShowcase: React.FC<ComponentShowcaseProps> = ({ componentName }) => {
  if (!componentName) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '32px',
        fontWeight: 'bold',
        pointerEvents: 'none',
      }}
    >
      {componentName}
    </div>
  );
};

export default ComponentShowcase;