export function FlagIT({ className = "w-8 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
      <rect width="213.3" height="480" fill="#009246"/>
      <rect width="213.3" height="480" x="213.3" fill="#FFF"/>
      <rect width="213.3" height="480" x="426.6" fill="#CE2B37"/>
    </svg>
  );
}
