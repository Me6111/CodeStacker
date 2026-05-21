import React from 'react';

const TrashIcon: React.FC<{ size?: number }> = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 13 13" fill="currentColor">
    <rect x="1" y="3" width="11" height="1.5" rx="0.75" />
    <rect x="4" y="1" width="5" height="1.5" rx="0.75" />
    <rect x="2" y="4.5" width="9" height="7.5" rx="1" />
    <rect x="4.5" y="6" width="1" height="4" rx="0.5" fill="black" />
    <rect x="6" y="6" width="1" height="4" rx="0.5" fill="black" />
    <rect x="7.5" y="6" width="1" height="4" rx="0.5" fill="black" />
  </svg>
);

export default TrashIcon;
