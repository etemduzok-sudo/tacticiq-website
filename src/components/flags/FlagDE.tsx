import React from 'react';
import Svg, { Rect } from 'react-native-svg';

interface FlagProps {
  size?: number;
}

export const FlagDE: React.FC<FlagProps> = ({ size = 48 }) => (
  <Svg width={size} height={size * 0.6} viewBox="0 0 5 3">
    <Rect id="black_stripe" width="5" height="3" y="0" x="0" fill="#000"/>
    <Rect id="red_stripe" width="5" height="2" y="1" x="0" fill="#D00"/>
    <Rect id="gold_stripe" width="5" height="1" y="2" x="0" fill="#FFCE00"/>
  </Svg>
);

export default FlagDE;
