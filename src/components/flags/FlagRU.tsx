import React from 'react';
import Svg, { Rect } from 'react-native-svg';

interface FlagProps {
  size?: number;
}

export const FlagRU: React.FC<FlagProps> = ({ size = 48 }) => (
  <Svg width={size} height={size * 0.6} viewBox="0 0 9 6">
    <Rect width="9" height="6" fill="#fff"/>
    <Rect width="9" height="4" y="2" fill="#0039A6"/>
    <Rect width="9" height="2" y="4" fill="#D52B1E"/>
  </Svg>
);

export default FlagRU;
