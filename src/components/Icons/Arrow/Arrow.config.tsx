import React from 'react';
import Arrow from './Arrow';
import ArrowSourceCodeRaw from './Arrow.tsx?raw';

const Arrow_Config = {
  key: 'Arrow',
  Name: 'Arrow',
  ComponentDefinitionCodeRaw: ArrowSourceCodeRaw,
  Component: Arrow,
  defaultProps: {
    width: 24,
    height: 16,
    direction: 'right',
    strokeColor: 'white',
  },
};

export default Arrow_Config;