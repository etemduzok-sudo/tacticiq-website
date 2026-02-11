// PlayerRatingSlider.tsx - Reusable Rating Slider Component
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PlayerRatingSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  showValue?: boolean;
  minValue?: number;
  maxValue?: number;
  trackHeight?: number;
  thumbSize?: number;
}

// Puan rengini hesapla (1-10 arası)
const getRatingColor = (rating: number): string => {
  if (rating >= 8) return '#22C55E'; // Yeşil
  if (rating >= 6) return '#84CC16'; // Açık yeşil
  if (rating >= 5) return '#FBBF24'; // Sarı
  if (rating >= 4) return '#F97316'; // Turuncu
  return '#EF4444'; // Kırmızı
};

// Gradient renkleri
const getGradientColors = (rating: number): [string, string] => {
  const baseColor = getRatingColor(rating);
  return [baseColor, `${baseColor}88`];
};

export const PlayerRatingSlider: React.FC<PlayerRatingSliderProps> = ({
  value,
  onChange,
  disabled = false,
  showValue = true,
  minValue = 1,
  maxValue = 10,
  trackHeight = 8,
  thumbSize = 24,
}) => {
  const [sliderWidth, setSliderWidth] = useState(200);
  const [isDragging, setIsDragging] = useState(false);

  // Değeri slider pozisyonuna çevir
  const valueToPosition = useCallback((val: number) => {
    const range = maxValue - minValue;
    const percentage = (val - minValue) / range;
    return percentage * sliderWidth;
  }, [sliderWidth, minValue, maxValue]);

  // Pozisyonu değere çevir
  const positionToValue = useCallback((pos: number) => {
    const range = maxValue - minValue;
    const percentage = Math.max(0, Math.min(1, pos / sliderWidth));
    const rawValue = minValue + (percentage * range);
    // 0.5'lik adımlarla yuvarla
    return Math.round(rawValue * 2) / 2;
  }, [sliderWidth, minValue, maxValue]);

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: (evt) => {
          if (disabled) return;
          setIsDragging(true);
          const touchX = evt.nativeEvent.locationX;
          const newValue = positionToValue(touchX);
          onChange(newValue);
        },
        onPanResponderMove: (evt) => {
          if (disabled) return;
          const touchX = evt.nativeEvent.locationX;
          const newValue = positionToValue(touchX);
          onChange(newValue);
        },
        onPanResponderRelease: () => {
          setIsDragging(false);
        },
        onPanResponderTerminate: () => {
          setIsDragging(false);
        },
      }),
    [disabled, positionToValue, onChange]
  );

  const thumbPosition = valueToPosition(value);
  const fillPercentage = ((value - minValue) / (maxValue - minValue)) * 100;
  const ratingColor = getRatingColor(value);

  return (
    <View style={styles.container}>
      {/* Slider Track */}
      <View
        style={[styles.trackContainer, { height: trackHeight + thumbSize }]}
        onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        {/* Background Track */}
        <View style={[styles.track, { height: trackHeight }]}>
          {/* Fill Track */}
          <LinearGradient
            colors={getGradientColors(value)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.trackFill,
              { 
                width: `${fillPercentage}%`,
                height: trackHeight,
              }
            ]}
          />
        </View>

        {/* Thumb */}
        <View
          style={[
            styles.thumb,
            {
              width: thumbSize,
              height: thumbSize,
              borderRadius: thumbSize / 2,
              left: Math.max(0, Math.min(thumbPosition - thumbSize / 2, sliderWidth - thumbSize)),
              backgroundColor: ratingColor,
              transform: isDragging ? [{ scale: 1.2 }] : [{ scale: 1 }],
              opacity: disabled ? 0.5 : 1,
            },
          ]}
        >
          {showValue && (
            <Text style={styles.thumbText}>{value.toFixed(1)}</Text>
          )}
        </View>

        {/* Scale Markers with Numbers */}
        <View style={styles.scaleContainer}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <View key={num} style={styles.scaleMarkContainer}>
              <View
                style={[
                  styles.scaleMark,
                  num <= value && { backgroundColor: ratingColor },
                ]}
              />
              <Text 
                style={[
                  styles.scaleNumber,
                  num <= value && { color: ratingColor, fontWeight: '600' },
                ]}
              >
                {num}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  trackContainer: {
    width: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    width: '100%',
    backgroundColor: 'rgba(71, 85, 105, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  trackFill: {
    borderRadius: 4,
  },
  thumb: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
      },
    }),
  },
  thumbText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scaleContainer: {
    position: 'absolute',
    bottom: -2,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  scaleMarkContainer: {
    alignItems: 'center',
    flex: 1,
  },
  scaleMark: {
    width: 2,
    height: 4,
    backgroundColor: 'rgba(71, 85, 105, 0.4)',
    borderRadius: 1,
    marginBottom: 2,
  },
  scaleNumber: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '400',
  },
});

export default PlayerRatingSlider;
