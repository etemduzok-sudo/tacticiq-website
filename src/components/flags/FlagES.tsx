import React from 'react';
import Svg, { Rect } from 'react-native-svg';

interface FlagProps {
  size?: number;
}

export const FlagES: React.FC<FlagProps> = ({ size = 48 }) => (
  <Svg width={size} height={size * 0.67} viewBox="0 0 750 500">
    <Rect width="750" height="500" fill="#ad1519"/>
    <Rect y="125" width="750" height="250" fill="#fabd00"/>
  </Svg>
);

export default FlagES;
