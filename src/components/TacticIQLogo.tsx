import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop, G } from 'react-native-svg';

interface TacticIQLogoProps {
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
}

export const TacticIQLogo: React.FC<TacticIQLogoProps> = ({
  size = 100,
  primaryColor = '#0F2A24',
  secondaryColor = '#1FA2A6',
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      <Defs>
        <LinearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={primaryColor} stopOpacity="1" />
          <Stop offset="100%" stopColor={secondaryColor} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      
      {/* Soccer Ball with Tactical Elements */}
      <G>
        {/* Main Circle */}
        <Path
          d="M100 20C55.8172 20 20 55.8172 20 100C20 144.183 55.8172 180 100 180C144.183 180 180 144.183 180 100C180 55.8172 144.183 20 100 20Z"
          stroke="url(#logoGradient)"
          strokeWidth="4"
          fill="none"
        />
        
        {/* Tactical Grid Lines - Pentagon Pattern */}
        <Path
          d="M100 35L130 65L120 105L80 105L70 65L100 35Z"
          stroke="url(#logoGradient)"
          strokeWidth="3"
          fill="none"
        />
        
        {/* IQ Brain Symbol - Center */}
        <Path
          d="M85 90C85 85 90 80 95 80C100 80 105 85 105 90C105 95 100 100 95 100C90 100 85 95 85 90Z"
          fill="url(#logoGradient)"
        />
        <Path
          d="M105 90C105 85 110 80 115 80C120 80 125 85 125 90C125 95 120 100 115 100C110 100 105 95 105 90Z"
          fill="url(#logoGradient)"
        />
        
        {/* Tactical Arrow */}
        <Path
          d="M100 120L100 140L90 130L100 120L110 130L100 140"
          stroke="url(#logoGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Data Points */}
        <Path d="M140 70C140 72.7614 137.761 75 135 75C132.239 75 130 72.7614 130 70C130 67.2386 132.239 65 135 65C137.761 65 140 67.2386 140 70Z" fill={secondaryColor} />
        <Path d="M70 70C70 72.7614 67.7614 75 65 75C62.2386 75 60 72.7614 60 70C60 67.2386 62.2386 65 65 65C67.7614 65 70 67.2386 70 70Z" fill={secondaryColor} />
        <Path d="M140 130C140 132.761 137.761 135 135 135C132.239 135 130 132.761 130 130C130 127.239 132.239 125 135 125C137.761 125 140 127.239 140 130Z" fill={secondaryColor} />
        <Path d="M70 130C70 132.761 67.7614 135 65 135C62.2386 135 60 132.761 60 130C60 127.239 62.2386 125 65 125C67.7614 125 70 127.239 70 130Z" fill={secondaryColor} />
      </G>
    </Svg>
  );
};

export default TacticIQLogo;
