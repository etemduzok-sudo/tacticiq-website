import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

interface FlagProps {
  size?: number;
}

export const FlagTR: React.FC<FlagProps> = ({ size = 48 }) => (
  <Svg width={size} height={size * 0.67} viewBox="0 -30000 90000 60000">
    <Rect x="0" y="-30000" width="90000" height="60000" fill="#e30a17"/>
    <Path 
      fill="#fff" 
      d="m41750 0 13568-4408-8386 11541V-7133l8386 11541zm925 8021a15000 15000 0 1 1 0-16042 12000 12000 0 1 0 0 16042z"
    />
  </Svg>
);

export default FlagTR;
