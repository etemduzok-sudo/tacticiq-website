interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizes = {
    sm: {
      container: 'w-14 h-14', // %75 büyütüldü: 32px * 1.75 = 56px (w-14)
      text: 'text-base',
      gap: 'gap-1.5',
    },
    md: {
      container: 'w-[70px] h-[70px]', // %75 büyütüldü: 40px * 1.75 = 70px
      text: 'text-xl',
      gap: 'gap-2',
    },
    lg: {
      container: 'w-[98px] h-[98px]', // %75 büyütüldü: 56px * 1.75 = 98px
      text: 'text-3xl',
      gap: 'gap-3',
    },
  };

  const currentSize = sizes[size];

  return (
    <div className={`flex items-center ${currentSize.gap} group ${className}`}>
      {/* SVG Logo - Şeffaf Arka Plan, Dikdörtgen Yapı Yok */}
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
        />
      {showText && (
        <span className={`${currentSize.text} font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent group-hover:opacity-80 transition-opacity whitespace-nowrap`}>
          TacticIQ
        </span>
      )}
    </div>
  );
}