import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  title?: string;
}

export function VideoModal({ isOpen, onClose, videoId, title }: VideoModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal Container */}
      <div
        className={`relative z-10 w-full max-w-5xl mx-4 transition-all duration-300 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h3 className="text-xl font-semibold text-white">{title}</h3>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="ml-auto text-white hover:bg-white/10"
          >
            <X className="size-6" />
          </Button>
        </div>

        {/* Video Container - 16:9 Aspect Ratio */}
        <div className="relative w-full bg-black rounded-lg overflow-hidden shadow-2xl" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            title={title || 'TacticIQ Demo Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Info Text */}
        <p className="text-center text-white/80 text-sm mt-4">
          Press <kbd className="px-2 py-1 bg-white/10 rounded text-xs">ESC</kbd> or click outside to close
        </p>
      </div>
    </div>
  );
}
