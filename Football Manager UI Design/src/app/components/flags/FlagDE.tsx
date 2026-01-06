export function FlagDE({ className = "w-8 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
      <rect width="640" height="160" fill="#000"/>
      <rect width="640" height="160" y="160" fill="#D00"/>
      <rect width="640" height="160" y="320" fill="#FFCE00"/>
    </svg>
  );
}
