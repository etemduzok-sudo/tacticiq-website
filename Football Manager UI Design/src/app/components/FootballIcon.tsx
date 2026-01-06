export function FootballIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* Ball Circle */}
      <defs>
        <radialGradient id="ballGradient">
          <stop offset="0%" stopColor="#f0f0f0" />
          <stop offset="70%" stopColor="#e0e0e0" />
          <stop offset="100%" stopColor="#c0c0c0" />
        </radialGradient>
      </defs>
      
      <circle cx="50" cy="50" r="48" fill="url(#ballGradient)" stroke="#8e8e8e" strokeWidth="1"/>
      
      {/* Center black pentagon */}
      <path 
        d="M50 30 L62 40 L56 54 L44 54 L38 40 Z" 
        fill="#1a2332" 
        stroke="#2a3542" 
        strokeWidth="0.5"
      />
      
      {/* Top left hexagon */}
      <path 
        d="M38 40 L30 36 L26 24 L34 16 L44 20 L50 30 Z" 
        fill="#2a3542" 
        stroke="#3a4552" 
        strokeWidth="0.5"
        opacity="0.9"
      />
      
      {/* Top right hexagon */}
      <path 
        d="M62 40 L70 36 L74 24 L66 16 L56 20 L50 30 Z" 
        fill="#2a3542" 
        stroke="#3a4552" 
        strokeWidth="0.5"
        opacity="0.9"
      />
      
      {/* Left hexagon */}
      <path 
        d="M38 40 L22 48 L16 58 L20 70 L32 72 L44 54 Z" 
        fill="#2a3542" 
        stroke="#3a4552" 
        strokeWidth="0.5"
        opacity="0.95"
      />
      
      {/* Right hexagon */}
      <path 
        d="M62 40 L78 48 L84 58 L80 70 L68 72 L56 54 Z" 
        fill="#2a3542" 
        stroke="#3a4552" 
        strokeWidth="0.5"
        opacity="0.95"
      />
      
      {/* Bottom pentagon */}
      <path 
        d="M44 54 L32 72 L38 84 L50 88 L62 84 L68 72 L56 54 Z" 
        fill="#1a2332" 
        stroke="#2a3542" 
        strokeWidth="0.5"
      />
    </svg>
  );
}