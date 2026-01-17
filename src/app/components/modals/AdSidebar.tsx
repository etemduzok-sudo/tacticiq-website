import { useState, useEffect, useContext, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { AdminDataContext, Advertisement } from '@/contexts/AdminDataContext';

export function AdSidebar() {
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
  const isSidebarEnabled = adSettings?.sidebarEnabled ?? false;
  const shouldRender = contextData && isSystemEnabled && isSidebarEnabled;

  // Effect to handle ad system enable/disable - IMMEDIATELY close when disabled
  useEffect(() => {
    if (!isSystemEnabled || !isSidebarEnabled) {
      setShowAd(false);
      setCurrentAd(null);
    }
  }, [isSystemEnabled, isSidebarEnabled]);

  useEffect(() => {
    // Check if ad system and sidebar ads are enabled
    if (!isSystemEnabled || !isSidebarEnabled) {
      setShowAd(false);
      setCurrentAd(null);
      return;
    }

    const activeAds = advertisements.filter(ad => ad.enabled && ad.placement === 'sidebar');
    if (activeAds.length === 0) {
      setShowAd(false);
      setCurrentAd(null);
      return;
    }

    // Get a random active ad
    const randomAd = activeAds[Math.floor(Math.random() * activeAds.length)];
    
    const checkAndShowAd = () => {
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
  }, [advertisements, isSystemEnabled, isSidebarEnabled]);

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
    <Card className="fixed right-4 bottom-20 z-40 w-80 shadow-2xl overflow-hidden animate-in slide-in-from-right">
      {/* Close Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 z-10 h-6 w-6 rounded-full bg-black/50 hover:bg-black/70 text-white"
        onClick={handleClose}
      >
        <X className="size-3" />
      </Button>

      {/* Ad Media */}
      <div 
        className={`${currentAd.linkUrl ? 'cursor-pointer' : ''}`}
        onClick={handleClick}
      >
        {currentAd.type === 'image' ? (
          <img
            src={currentAd.mediaUrl}
            alt={currentAd.title}
            className="w-full h-auto max-h-96 object-cover"
          />
        ) : (
          <video
            src={currentAd.mediaUrl}
            autoPlay
            muted
            loop
            className="w-full h-auto max-h-96 object-cover"
          />
        )}
      </div>

      {/* Ad Footer */}
      <div className="p-3 border-t bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-xs">{currentAd.title}</h3>
            <p className="text-xs text-muted-foreground">Reklam</p>
          </div>
          {currentAd.linkUrl && (
            <Button onClick={handleClick} size="sm" className="h-7 text-xs">
              Detaylar
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
