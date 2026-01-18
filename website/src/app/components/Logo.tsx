interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizes = {
    sm: {
      container: 'w-8 h-8', // 32px - küçük logo
      text: 'text-base',
      gap: 'gap-1.5',
    },
    md: {
      container: 'w-10 h-10', // 40px - header için uygun
      text: 'text-xl',
      gap: 'gap-2',
    },
    lg: {
      container: 'w-14 h-14', // 56px - büyük logo
      text: 'text-2xl',
      gap: 'gap-3',
    },
  };

  const currentSize = sizes[size];

  return (
    <div className={`flex items-center ${currentSize.gap} group ${className}`}>
      {/* SVG Logo - Fallback: TacticIQ.svg veya logo.svg */}
      <img 
        src="/TacticIQ.svg" 
        alt="TacticIQ Logo" 
        className={`${currentSize.container} object-contain flex-shrink-0`}
        style={{
          backgroundColor: 'transparent',
          background: 'transparent',
          border: 'none',
          outline: 'none'
        }}
        onError={(e) => {
          // Fallback to logo.svg if TacticIQ.svg fails
          const target = e.target as HTMLImageElement;
          if (!target.src.includes('logo.svg')) {
            target.src = '/logo.svg';
          }
        }}
      />
      {showText && (
        <span className={`${currentSize.text} font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent group-hover:opacity-80 transition-opacity whitespace-nowrap`}>
          TacticIQ
        </span>
      )}
    </div>
  );
}