import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface FlagProps {
  size?: number;
}

export const FlagCN: React.FC<FlagProps> = ({ size = 48 }) => (
  <Svg width={size} height={size * 0.67} viewBox="0 0 900 600">
    <Path fill="#DE2910" d="M0 0h900v600H0z"/>
    {/* Büyük yıldız */}
    <Path fill="#FFDE00" d="M225 300l-50-15-15-50 15-50 50-15 50 15 15 50-15 50-50 15z"/>
    {/* Küçük yıldızlar */}
    <Path fill="#FFDE00" d="M300 150l-20-6-6-20 6-20 20-6 20 6 6 20-6 20-20 6z"/>
    <Path fill="#FFDE00" d="M350 200l-20-6-6-20 6-20 20-6 20 6 6 20-6 20-20 6z"/>
    <Path fill="#FFDE00" d="M350 300l-20-6-6-20 6-20 20-6 20 6 6 20-6 20-20 6z"/>
    <Path fill="#FFDE00" d="M300 400l-20-6-6-20 6-20 20-6 20 6 6 20-6 20-20 6z"/>
  </Svg>
);

export default FlagCN;
