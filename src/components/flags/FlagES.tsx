import React from 'react';
import Svg, { Rect, G, Path, Circle, Ellipse } from 'react-native-svg';

interface FlagProps {
  size?: number;
}

export const FlagES: React.FC<FlagProps> = ({ size = 48 }) => (
  <Svg width={size} height={size * 0.67} viewBox="0 0 750 500">
    {/* Kırmızı şeritler */}
    <Rect width="750" height="500" fill="#AA151B"/>
    {/* Sarı şerit */}
    <Rect y="125" width="750" height="250" fill="#F1BF00"/>
    
    {/* Basitleştirilmiş arma (küçük boyutta görünür) */}
    <G transform="translate(136, 167) scale(0.35)">
      {/* Kalkan ana rengi */}
      <Ellipse cx="150" cy="200" rx="120" ry="150" fill="#AA151B" stroke="#F1BF00" strokeWidth="8"/>
      
      {/* Kalkan bölümleri */}
      <Rect x="70" y="80" width="70" height="100" fill="#AA151B"/>
      <Rect x="140" y="80" width="70" height="100" fill="#FFFFFF"/>
      <Rect x="70" y="180" width="70" height="80" fill="#F1BF00"/>
      <Rect x="140" y="180" width="70" height="80" fill="#AA151B"/>
      
      {/* Sütunlar */}
      <Rect x="20" y="120" width="20" height="160" fill="#C0C0C0"/>
      <Rect x="260" y="120" width="20" height="160" fill="#C0C0C0"/>
      
      {/* Taç */}
      <Path d="M100 50 L150 20 L200 50 L200 80 L100 80 Z" fill="#F1BF00"/>
      <Circle cx="150" cy="35" r="8" fill="#AA151B"/>
    </G>
  </Svg>
);

export default FlagES;
