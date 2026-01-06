import React from 'react';
import Svg, { Path, ClipPath, Defs } from 'react-native-svg';

interface FlagProps {
  size?: number;
}

export const FlagGB: React.FC<FlagProps> = ({ size = 48 }) => (
  <Svg width={size} height={size * 0.6} viewBox="0 0 50 30">
    <Defs>
      <ClipPath id="t">
        <Path d="M25,15h25v15zv15h-25zh-25v-15zv-15h25z"/>
      </ClipPath>
    </Defs>
    <Path d="M0,0v30h50v-30z" fill="#012169"/>
    <Path d="M0,0 50,30M50,0 0,30" stroke="#fff" strokeWidth="6"/>
    <Path d="M0,0 50,30M50,0 0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4"/>
    <Path d="M-1 11h22v-12h8v12h22v8h-22v12h-8v-12h-22z" fill="#C8102E" stroke="#FFF" strokeWidth="2"/>
  </Svg>
);

export default FlagGB;
