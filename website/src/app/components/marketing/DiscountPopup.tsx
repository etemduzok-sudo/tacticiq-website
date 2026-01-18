import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminData, CURRENCY_SYMBOLS, LANGUAGE_CURRENCY_MAP, convertCurrency } from '@/contexts/AdminDataContext';
import { usePayment } from '@/contexts/PaymentContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { X, Zap, Check } from 'lucide-react';

interface DiscountPopupProps {
  onSelectPlan: () => void;
}

export function DiscountPopup({ onSelectPlan }: DiscountPopupProps) {
  const { t, language } = useLanguage();
  const { discountSettings, priceSettings } = useAdminData();
  const { selectPlan } = usePayment();
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(discountSettings.timerDuration);
  const [hasShownToday, setHasShownToday] = useState(false);

  // Dile göre para birimi belirleme
  const targetCurrency = LANGUAGE_CURRENCY_MAP[language] || 'TRY';
  const currencySymbol = CURRENCY_SYMBOLS[targetCurrency];

  useEffect(() => {
    // Admin panelinden discount ayarları
    if (!discountSettings.enabled) return;

    // Check if popup has been shown today
    const lastShown = localStorage.getItem('discount_popup_shown');
    const today = new Date().toDateString();
    
    if (lastShown === today) {
      setHasShownToday(true);
      return;
    }

    // Show popup after delay (admin kontrolü)
    const timer = setTimeout(() => {
      setIsOpen(true);
      localStorage.setItem('discount_popup_shown', today);
    }, discountSettings.showDelay);

    return () => clearTimeout(timer);
  }, [discountSettings.enabled, discountSettings.showDelay]);

  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClaim = () => {
    // showDiscountViaPopup aktifse: Kullanıcı popup'ı kabul etti, indirimli fiyat üzerinden satış yapılacak
    if (showDiscountViaPopup) {
      localStorage.setItem('discount_popup_accepted', 'true');
      localStorage.setItem('discount_popup_price', JSON.stringify({
        original: convertedOriginalPrice,
        discounted: discountedPrice,
        discountPercent: discountPercent,
        timestamp: Date.now()
      }));
    }
    selectPlan('pro');
    onSelectPlan();
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const showDiscountViaPopup = discountSettings.showDiscountViaPopup ?? false;
  const showDiscountOnWeb = discountSettings.showDiscountOnWeb ?? true;
  
  // Popup gösterim koşulları:
  // 1. discountSettings.enabled aktif olmalı
  // 2. showDiscountViaPopup aktifse → Popup göster (indirimli fiyat sadece popup'ta)
  // 3. showDiscountOnWeb aktifse → Popup göster (her iki modda da popup gösterilebilir)
  const shouldShowPopup = discountSettings.enabled && 
    (showDiscountViaPopup || (!showDiscountViaPopup && showDiscountOnWeb));
  
  if (!shouldShowPopup || hasShownToday) return null;

  // Fiyatı kullanıcının diline göre çevir - priceSettings'ten al (discountSettings'ten DEĞİL)
  // NOT: ?? (nullish coalescing) kullanıyoruz çünkü 0 geçerli bir değer
  const convertedOriginalPrice = convertCurrency(
    priceSettings.proPrice ?? 99.99,
    priceSettings.baseCurrency ?? 'TRY',
    targetCurrency
  );
  const discountPercent = discountSettings.discountPercent ?? 20;
  const discountedPrice = convertedOriginalPrice * (1 - discountPercent / 100);
  const savings = convertedOriginalPrice - discountedPrice;
  const billingPeriod = priceSettings.billingPeriod ?? 'yearly';
  const periodLabel = billingPeriod === 'monthly' ? 'aylık' : 'yıllık';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50 dark:from-[#0F2A24] dark:to-[#0a1f1a] border-primary/20">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 z-10"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="space-y-6 pt-4">
          {/* ÖZEL TEKLİF Badge */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-secondary/20 to-accent/20 text-primary dark:text-secondary rounded-full text-sm font-bold mb-4 border border-secondary/30">
              <span className="text-lg">✨</span>
              <span>ÖZEL TEKLİF</span>
              <span className="text-lg">✨</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-primary dark:text-white mb-2">
              {currencySymbol}{savings.toFixed(0)} Tasarruf Edin!
            </h2>
            <p className="text-sm text-muted-foreground">
              Şimdi kaydolun ve {periodLabel} pakette %{discountPercent} indirim kazanın
            </p>
          </div>

          {/* Timer - Kırmızı Kutu */}
          <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
            <div className="text-xs text-red-700 dark:text-red-300 mb-1 font-semibold">
              Teklif sona eriyor:
          </div>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Price Comparison */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-left">
                <div className="text-sm text-muted-foreground mb-1">Normal Fiyat</div>
                <div className="text-2xl font-semibold line-through text-muted-foreground">
                  {currencySymbol}{convertedOriginalPrice.toFixed(0)}
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="text-red-500 dark:text-red-400 text-3xl">↓</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-green-600 dark:text-green-400 mb-1">İndirimli Fiyat</div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {currencySymbol}{discountedPrice.toFixed(0)}
                </div>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 text-center">
              <div className="text-sm font-semibold text-green-700 dark:text-green-300">
                {currencySymbol}{savings.toFixed(0)} tasarruf • %{discountPercent} indirim
          </div>
          </div>
        </div>

        {/* Features */}
          <div className="space-y-3">
            <div className="text-base font-bold text-foreground">
              {billingPeriod === 'monthly' ? 'Aylık' : 'Yıllık'} Pakete Dahil:
          </div>
            <div className="space-y-2.5">
              {[
                'Sınırsız tahmin ve analiz',
                'Tamamen reklamsız deneyim',
                'Gelişmiş AI destekli raporlar',
                'Öncelikli teknik destek',
          ].map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="size-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" strokeWidth={3} />
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
            </div>
        </div>

        {/* Actions */}
          <div className="space-y-3 pt-2">
          <Button
            onClick={handleClaim}
              className="w-full gap-2 bg-gradient-to-r from-secondary to-accent hover:opacity-90 text-white py-6 text-base font-semibold shadow-xl"
            size="lg"
          >
            <Zap className="size-5" />
              İndirimi Kullan
          </Button>
          <Button
            onClick={handleClose}
            variant="ghost"
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            size="sm"
          >
              Daha sonra hatırlat
          </Button>
        </div>

        {/* Security Note */}
          <p className="text-xs text-center text-muted-foreground pt-2 border-t">
            🔒 Güvenli ödeme • İstediğiniz zaman iptal edebilirsiniz
        </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}