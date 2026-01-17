import { useState, useEffect, useContext, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { AdminDataContext, Advertisement } from '@/contexts/AdminDataContext';

export function AdBanner() {
  // ALL HOOKS MUST BE AT THE TOP - BEFORE ANY CONDITIONAL RETURNS
  const contextData = useContext(AdminDataContext);
  const [currentAd, setCurrentAd] = useState<Advertisement | null>(null);
  const [showAd, setShowAd] = useState(false);
  const lastShownTimeRef = useRef<number>(0);
  
  // Extract values from context (with fallbacks for when context is null)
  const advertisements = contextData?.advertisements ?? [];
  const adSettings = contextData?.adSettings ?? null;
  
  // Check if system is enabled
  const isSystemEnabled = adSettings?.systemEnabled ?? false;
  const isBannerEnabled = adSettings?.bannerEnabled ?? false;
  const shouldRender = contextData && isSystemEnabled && isBannerEnabled;

  // Effect to handle ad system enable/disable - IMMEDIATELY close when disabled
  useEffect(() => {
    if (!isSystemEnabled || !isBannerEnabled) {
      setShowAd(false);
      setCurrentAd(null);
    }
  }, [isSystemEnabled, isBannerEnabled]);

  useEffect(() => {
    // Check if ad system and banner ads are enabled
    if (!isSystemEnabled || !isBannerEnabled) {
      setShowAd(false);
      setCurrentAd(null);
      return;
    }

    const activeAds = advertisements.filter(ad => ad.enabled && ad.placement === 'banner');
    if (activeAds.length === 0) {
      setShowAd(false);
      setCurrentAd(null);
      return;
    }

    // Get a random active ad
    const randomAd = activeAds[Math.floor(Math.random() * activeAds.length)];
    
    const checkAndShowAd = () => {
      // Double check before showing
      if (!isSystemEnabled || !isBannerEnabled) {
        setShowAd(false);
        setCurrentAd(null);
        return;
      }

      const now = Date.now();
      const timeSinceLastAd = (now - lastShownTimeRef.current) / 1000 / 60; // minutes
      
      if (timeSinceLastAd >= randomAd.frequency || lastShownTimeRef.current === 0) {
        setCurrentAd(randomAd);
        setShowAd(true);
        lastShownTimeRef.current = now;

        // Auto close after duration
        setTimeout(() => {
          setShowAd(false);
        }, randomAd.duration * 1000);
      }
    };

    // Initial check
    checkAndShowAd();

    // Set interval to check for next ad
    const interval = setInterval(() => {
      checkAndShowAd();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [advertisements, isSystemEnabled, isBannerEnabled]);

  // CONDITIONAL RETURNS AFTER ALL HOOKS
  if (!shouldRender || !showAd || !currentAd) {
    return null;
  }

  const handleClose = () => {
    setShowAd(false);
  };

  const handleClick = () => {
    if (currentAd.linkUrl) {
      window.open(currentAd.linkUrl, '_blank');
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b shadow-lg animate-in slide-in-from-top">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-4">
        {/* Ad Content */}
        <div 
          className={`flex items-center gap-4 flex-1 ${currentAd.linkUrl ? 'cursor-pointer' : ''}`}
          onClick={handleClick}
        >
          {currentAd.type === 'image' ? (
            <img
              src={currentAd.mediaUrl}
              alt={currentAd.title}
              className="h-12 w-auto object-contain"
            />
          ) : (
            <video
              src={currentAd.mediaUrl}
              autoPlay
              muted
              loop
              className="h-12 w-auto object-contain"
            />
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{currentAd.title}</h3>
            <p className="text-xs text-muted-foreground">Reklam</p>
          </div>
        </div>

        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={handleClose}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
