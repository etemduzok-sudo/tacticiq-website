import { useState, useEffect, useContext, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { AdminDataContext, Advertisement } from '@/contexts/AdminDataContext';

export function AdPopup() {
  // ALL HOOKS MUST BE AT THE TOP - BEFORE ANY CONDITIONAL RETURNS
  const contextData = useContext(AdminDataContext);
  const [currentAd, setCurrentAd] = useState<Advertisement | null>(null);
  const [showAd, setShowAd] = useState(false);
  const lastShownTimeRef = useRef<number>(0);
  const [closedAds, setClosedAds] = useState<string[]>([]);
  
  // Extract values from context (with fallbacks for when context is null)
  const advertisements = contextData?.advertisements ?? [];
  const adSettings = contextData?.adSettings ?? null;
  const updateAdvertisement = contextData?.updateAdvertisement ?? null;
  
  // Check if system is enabled
  const isSystemEnabled = adSettings?.systemEnabled ?? false;
  const isPopupEnabled = adSettings?.popupEnabled ?? false;
  const shouldRender = contextData && isSystemEnabled && isPopupEnabled;

  // Load closed ads from localStorage on mount
  useEffect(() => {
    const savedClosedAds = localStorage.getItem('tacticiq_closed_popup_ads');
    if (savedClosedAds) {
      try {
        setClosedAds(JSON.parse(savedClosedAds));
      } catch (e) {
        console.error('Error loading closed ads:', e);
      }
    }
  }, []);

  // Effect to handle ad system enable/disable - IMMEDIATELY close when disabled
  useEffect(() => {
    if (!isSystemEnabled || !isPopupEnabled) {
      setShowAd(false);
      setCurrentAd(null);
    }
  }, [isSystemEnabled, isPopupEnabled]);

  useEffect(() => {
    // Check if ad system and popup ads are enabled - Close immediately if disabled
    if (!isSystemEnabled || !isPopupEnabled) {
      setShowAd(false);
      setCurrentAd(null);
      return;
    }

    // Filter active ads that haven't reached display limit and haven't been closed
    const activeAds = advertisements.filter(ad => {
      if (!ad.enabled || ad.placement !== 'popup') return false;
      if (ad.displayCount && ad.currentDisplays && ad.currentDisplays >= ad.displayCount) return false;
      if (closedAds.includes(ad.id)) return false; // Skip closed ads
      return true;
    });
    if (activeAds.length === 0) return;

    // Get a random active ad
    const randomAd = activeAds[Math.floor(Math.random() * activeAds.length)];
    
    const checkAndShowAd = () => {
      const now = Date.now();
      const timeSinceLastAd = (now - lastShownTimeRef.current) / 1000 / 60; // minutes
      
      if (timeSinceLastAd >= randomAd.frequency || lastShownTimeRef.current === 0) {
        setCurrentAd(randomAd);
        setShowAd(true);
        lastShownTimeRef.current = now;

        // Increment display count
        if (updateAdvertisement) {
          updateAdvertisement(randomAd.id, {
            currentDisplays: (randomAd.currentDisplays || 0) + 1
          });
        }

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
  }, [advertisements, isSystemEnabled, isPopupEnabled, closedAds, updateAdvertisement]);

  // CONDITIONAL RETURNS AFTER ALL HOOKS
  if (!shouldRender || !showAd || !currentAd) {
    return null;
  }

  const handleClose = () => {
    setShowAd(false);
    // Add ad to closed ads list and save to localStorage
    setClosedAds(prev => [...prev, currentAd.id]);
    localStorage.setItem('tacticiq_closed_popup_ads', JSON.stringify([...closedAds, currentAd.id]));
  };

  const handleClick = () => {
    if (currentAd.linkUrl) {
      window.open(currentAd.linkUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Ad Content */}
      <Card className="relative max-w-2xl w-full shadow-2xl overflow-hidden">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white"
          onClick={handleClose}
        >
          <X className="size-4" />
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
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          ) : (
            <video
              src={currentAd.mediaUrl}
              autoPlay
              muted
              loop
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          )}
        </div>

        {/* Ad Footer */}
        <div className="p-4 border-t bg-background">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">{currentAd.title}</h3>
              <p className="text-xs text-muted-foreground">Reklam</p>
            </div>
            {currentAd.linkUrl && (
              <Button onClick={handleClick} size="sm">
                Detaylar
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
