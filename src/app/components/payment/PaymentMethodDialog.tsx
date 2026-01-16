import { useLanguage } from '@/contexts/LanguageContext';
import { usePayment } from '@/contexts/PaymentContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Separator } from '@/app/components/ui/separator';
import { Apple, Chrome, Loader2, ShieldCheck } from 'lucide-react';

interface PaymentMethodDialogProps {
  open: boolean;
  onClose: () => void;
  plan: { name: string; price: number } | null;
}

export function PaymentMethodDialog({ open, onClose, plan }: PaymentMethodDialogProps) {
  const { t } = useLanguage();
  const { initiateApplePay, initiateGooglePay, isProcessing } = usePayment();

  if (!plan) return null;

  const handlePaymentMethod = async (method: 'apple' | 'google') => {
    try {
      switch (method) {
        case 'apple':
          await initiateApplePay(plan.price, plan.name);
          break;
        case 'google':
          await initiateGooglePay(plan.price, plan.name);
          break;
      }
      onClose();
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {t('payment.title')}
          </DialogTitle>
          <DialogDescription>
            {t('payment.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Plan Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{plan.name}</span>
              <span className="text-2xl font-bold text-secondary">
                {typeof plan.price === 'number' ? `$${plan.price.toFixed(2)}` : plan.price}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('payment.plan_description')}
            </p>
          </div>

          <Separator />

          {/* Payment Methods */}
          <div className="space-y-3">
            <p className="text-sm font-medium">{t('payment.select_method')}</p>

            {/* Apple Pay */}
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-4"
              onClick={() => handlePaymentMethod('apple')}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="size-6 animate-spin" />
              ) : (
                <div className="size-10 rounded-lg bg-black flex items-center justify-center">
                  <Apple className="size-6 text-white" />
                </div>
              )}
              <div className="text-left flex-1">
                <div className="font-semibold">{t('payment.apple.title')}</div>
                <div className="text-xs text-muted-foreground">
                  {t('payment.apple.description')}
                </div>
              </div>
            </Button>

            {/* Google Pay */}
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-4"
              onClick={() => handlePaymentMethod('google')}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="size-6 animate-spin" />
              ) : (
                <div className="size-10 rounded-lg bg-white border-2 flex items-center justify-center">
                  <Chrome className="size-6 text-blue-600" />
                </div>
              )}
              <div className="text-left flex-1">
                <div className="font-semibold">{t('payment.google.title')}</div>
                <div className="text-xs text-muted-foreground">
                  {t('payment.google.description')}
                </div>
              </div>
            </Button>
          </div>

          <Separator />

          {/* Security Notice */}
          <div className="flex items-start gap-2 rounded-lg bg-secondary/10 p-3 text-xs">
            <ShieldCheck className="size-4 shrink-0 text-secondary mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-secondary">{t('payment.security.title')}</p>
              <p className="text-muted-foreground">
                {t('payment.security.description')}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}