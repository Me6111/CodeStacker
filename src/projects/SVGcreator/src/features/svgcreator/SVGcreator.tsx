import React from 'react';
import { SVGcreatorProvider } from './context/SVGcreatorProvider';
import ObjectMap from './components/ObjectMap/ObjectMap';
import Toolbar from './components/Toolbar/Toolbar';
import Board from './components/Board/Board';
import CodePreview from './components/CodePreview/CodePreview';

const SVGCreator: React.FC = () => {
  return (
    <SVGcreatorProvider>
      <div style={{
        display: 'flex',
        height: '100vh',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        overflow: 'hidden',
        background: '#000000',
      }}>
        <ObjectMap />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Toolbar />
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <Board />
            <CodePreview />
          </div>
        </div>
      </div>
    </SVGcreatorProvider>
  );
};

export default SVGCreator;
export { SVGCreator };
