import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface FlagProps {
  size?: number;
}

export const FlagFR: React.FC<FlagProps> = ({ size = 48 }) => (
  <Svg width={size} height={size * 0.67} viewBox="0 0 900 600">
    <Path fill="#CE1126" d="M0 0h900v600H0"/>
    <Path fill="#fff" d="M0 0h600v600H0"/>
    <Path fill="#002654" d="M0 0h300v600H0"/>
  </Svg>
);

export default FlagFR;
