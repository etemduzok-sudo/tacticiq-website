export function FlagES({ className = "w-8 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
      <rect width="640" height="480" fill="#c60b1e"/>
      <rect width="640" height="240" y="120" fill="#ffc400"/>
    </svg>
  );
}
