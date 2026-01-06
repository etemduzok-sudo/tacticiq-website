import React from 'react';
import Svg, { Rect } from 'react-native-svg';

interface FlagProps {
  size?: number;
}

export const FlagIT: React.FC<FlagProps> = ({ size = 48 }) => (
  <Svg width={size} height={size * 0.67} viewBox="0 0 3 2">
    <Rect width="3" height="2" fill="#009246"/>
    <Rect width="2" height="2" x="1" fill="#fff"/>
    <Rect width="1" height="2" x="2" fill="#ce2b37"/>
  </Svg>
);

export default FlagIT;
