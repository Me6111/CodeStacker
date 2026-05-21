import React from 'react';
import { useToolContext } from '../../context/ToolContext';

const PointLevelToolbar: React.FC = () => {
  const { tool, setTool } = useToolContext();

  return (
    <button
      onClick={() => setTool('move')}
      style={{
        padding: '6px 16px',
        background: tool === 'move' ? '#107c10' : '#f0f0f0',
        color: tool === 'move' ? 'white' : '#333',
        border: '1px solid #d0d0d0',
        borderRadius: 3,
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 500,
      }}
    >
      Move
    </button>
  );
};

export default PointLevelToolbar;