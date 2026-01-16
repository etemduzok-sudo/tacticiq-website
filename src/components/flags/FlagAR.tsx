import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface FlagProps {
  size?: number;
}

export const FlagAR: React.FC<FlagProps> = ({ size = 48 }) => (
  <Svg width={size} height={size * 0.67} viewBox="0 0 900 600">
    <Path fill="#006C35" d="M0 0h900v600H0z"/>
    <Path fill="#fff" d="M0 0h900v200H0zm0 400h900v200H0z"/>
    <Path fill="#000" d="M0 0h300v600H0z"/>
    <Path fill="#fff" d="M150 200l50 150-50 150 50-150z"/>
    <Path fill="#006C35" d="M150 200l25 75-25 75 25-75z"/>
  </Svg>
);

export default FlagAR;
