import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';

interface AnimatedPriceProps {
  value: number;
  currency: string;
  symbol: string;
  className?: string;
  duration?: number;
}

export function AnimatedPrice({
  value,
  currency,
  symbol,
  className = '',
  duration = 2000,
}: AnimatedPriceProps) {
  const [displayValue, setDisplayValue] = useState(value);

  // Spring animation for smooth counting
  const spring = useSpring(value, {
    damping: 25,
    stiffness: 100,
  });

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      setDisplayValue(Math.round(latest));
    });

    return () => unsubscribe();
  }, [spring]);

  // TL için sağ tarafta, diğerleri sol tarafta
  const formattedPrice = currency === 'TRY' 
    ? `${symbol}${displayValue}` 
    : `${symbol}${displayValue}`;

  return (
    <motion.span
      className={className}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      {formattedPrice}
    </motion.span>
  );
}

interface CountUpPriceProps {
  from: number;
  to: number;
  currency: string;
  symbol: string;
  className?: string;
  onComplete?: () => void;
}

/**
 * Count-up animasyonu ile fiyat değişimi
 */
export function CountUpPrice({
  from,
  to,
  currency,
  symbol,
  className = '',
  onComplete,
}: CountUpPriceProps) {
  const [count, setCount] = useState(from);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (from === to) return;

    setIsAnimating(true);
    const duration = 1500; // 1.5 saniye
    const steps = 60;
    const stepValue = (to - from) / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      
      if (currentStep >= steps) {
        setCount(to);
        clearInterval(interval);
        setIsAnimating(false);
        onComplete?.();
      } else {
        setCount(Math.round(from + stepValue * currentStep));
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [from, to, onComplete]);

  const formattedPrice = currency === 'TRY' 
    ? `${symbol}${count}` 
    : `${symbol}${count}`;

  return (
    <motion.span
      className={className}
      animate={isAnimating ? {
        scale: [1, 1.15, 1],
        color: ['currentColor', '#1FA2A6', 'currentColor'],
      } : {}}
      transition={{ duration: 0.3, repeat: isAnimating ? Infinity : 0 }}
    >
      {formattedPrice}
    </motion.span>
  );
}
