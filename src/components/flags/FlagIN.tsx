import React from 'react';
import Svg, { Rect, Circle, G, Line } from 'react-native-svg';

interface FlagProps {
  size?: number;
}

export const FlagIN: React.FC<FlagProps> = ({ size = 48 }) => {
  const width = size;
  const height = size * 0.667; // Aspect ratio 3:2
  
  return (
    <Svg width={width} height={height} viewBox="0 0 900 600">
      {/* Saffron (top) */}
      <Rect width="900" height="200" fill="#FF9933"/>
      {/* White (middle) */}
      <Rect y="200" width="900" height="200" fill="#FFFFFF"/>
      {/* Green (bottom) */}
      <Rect y="400" width="900" height="200" fill="#138808"/>
      {/* Ashoka Chakra (blue wheel in center) */}
      <Circle cx="450" cy="300" r="60" fill="none" stroke="#000080" strokeWidth="4"/>
      {/* 24 spokes of the wheel */}
      <G stroke="#000080" strokeWidth="2">
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 15 * Math.PI) / 180;
          const x1 = 450 + 20 * Math.cos(angle);
          const y1 = 300 + 20 * Math.sin(angle);
          const x2 = 450 + 55 * Math.cos(angle);
          const y2 = 300 + 55 * Math.sin(angle);
          return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </G>
      <Circle cx="450" cy="300" r="12" fill="#000080"/>
    </Svg>
  );
};

export default FlagIN;
