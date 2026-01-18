import { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { PaymentMethodDialog } from '@/app/components/payment/PaymentMethodDialog';

interface PaymentContextType {
  initiateApplePay: (amount: number, planName: string) => Promise<void>;
  initiateGooglePay: (amount: number, planName: string) => Promise<void>;
  initiateCardPayment: (amount: number, planName: string) => Promise<void>;
  selectPlan: (planId: 'free' | 'pro') => void;
  openPaymentModal: (price?: number) => void;
  isProcessing: boolean;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export function PaymentProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentPrice, setPaymentPrice] = useState<number | undefined>(undefined);

  const initiateApplePay = async (amount: number, planName: string) => {
    setIsProcessing(true);
    
    try {
      // Apple Pay availability check
      if (!window.ApplePaySession) {
        toast.error(t('payment.apple.not_available'));
        setIsProcessing(false);
        return;
      }

      // Check if Apple Pay is set up
      const canMakePayments = await window.ApplePaySession.canMakePayments();
      if (!canMakePayments) {
        toast.error(t('payment.apple.not_setup'));
        setIsProcessing(false);
        return;
      }

      // Create Apple Pay payment request
      const paymentRequest = {
        countryCode: 'US',
        currencyCode: 'USD',
        supportedNetworks: ['visa', 'masterCard', 'amex'],
        merchantCapabilities: ['supports3DS'],
        total: {
          label: `TacticIQ - ${planName}`,
          amount: amount.toString(),
        },
      };

      // Initialize Apple Pay session
      const session = new window.ApplePaySession(3, paymentRequest);

      session.onvalidatemerchant = async (event) => {
        // Merchant validation - backend'den gelecek
        console.log('Validating merchant:', event);
        // const merchantSession = await fetch('/api/payment/apple/validate', {
        //   method: 'POST',
        //   body: JSON.stringify({ validationURL: event.validationURL }),
        // }).then(res => res.json());
        // session.completeMerchantValidation(merchantSession);
      };

      session.onpaymentauthorized = async (event) => {
        // Payment processing - backend'de işlenecek
        console.log('Payment authorized:', event.payment);
        
        // Simulated success
        session.completePayment(window.ApplePaySession.STATUS_SUCCESS);
        toast.success(t('payment.success'));
        setIsProcessing(false);
      };

      session.oncancel = () => {
        toast.info(t('payment.cancelled'));
        setIsProcessing(false);
      };

      session.begin();
    } catch (error) {
      console.error('Apple Pay error:', error);
      toast.error(t('payment.error'));
      setIsProcessing(false);
    }
  };

  const initiateGooglePay = async (amount: number, planName: string) => {
    setIsProcessing(true);

    try {
      // Google Pay API yüklü mü kontrol et
      if (!window.google?.payments) {
        toast.error(t('payment.google.not_available'));
        setIsProcessing(false);
        return;
      }

      const paymentsClient = new window.google.payments.api.PaymentsClient({
        environment: 'TEST', // 'PRODUCTION' olarak değiştirilecek
      });

      // Payment request yapılandırması
      const paymentDataRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [
          {
            type: 'CARD',
            parameters: {
              allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
              allowedCardNetworks: ['MASTERCARD', 'VISA', 'AMEX'],
            },
            tokenizationSpecification: {
              type: 'PAYMENT_GATEWAY',
              parameters: {
                gateway: 'example', // Gerçek gateway adı buraya gelecek
                gatewayMerchantId: 'exampleGatewayMerchantId',
              },
            },
          },
        ],
        merchantInfo: {
          merchantId: 'BCR2DN4T3EXAMPLE', // Gerçek merchant ID buraya gelecek
          merchantName: 'TacticIQ',
        },
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPrice: amount.toString(),
          currencyCode: 'USD',
          countryCode: 'US',
        },
      };

      // Google Pay availability check
      const isReadyToPay = await paymentsClient.isReadyToPay({
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: paymentDataRequest.allowedPaymentMethods,
      });

      if (!isReadyToPay.result) {
        toast.error(t('payment.google.not_setup'));
        setIsProcessing(false);
        return;
      }

      // Show Google Pay button
      const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest);
      
      // Process payment token - backend'e gönderilecek
      console.log('Google Pay token:', paymentData.paymentMethodData.tokenizationData.token);
      
      toast.success(t('payment.success'));
      setIsProcessing(false);
    } catch (error) {
      console.error('Google Pay error:', error);
      if ((error as any).statusCode === 'CANCELED') {
        toast.info(t('payment.cancelled'));
      } else {
        toast.error(t('payment.error'));
      }
      setIsProcessing(false);
    }
  };

  const initiateCardPayment = async (amount: number, planName: string) => {
    setIsProcessing(true);

    try {
      // Stripe/Braintree gibi payment gateway entegrasyonu buraya gelecek
      console.log('Initiating card payment:', { amount, planName });
      
      // Simulated delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      toast.success(t('payment.success'));
      setIsProcessing(false);
    } catch (error) {
      console.error('Card payment error:', error);
      toast.error(t('payment.error'));
      setIsProcessing(false);
    }
  };

  // Fiyat belirleme: showDiscountViaPopup aktifse ve kullanıcı popup'ı kabul ettiyse indirimli fiyat kullan
  const getFinalPrice = (basePrice: number): number => {
    try {
      const popupAccepted = localStorage.getItem('discount_popup_accepted') === 'true';
      const popupPriceData = localStorage.getItem('discount_popup_price');
      
      if (popupAccepted && popupPriceData) {
        const priceData = JSON.parse(popupPriceData);
        // 1 saat içindeyse indirimli fiyatı kullan (timestamp kontrolü)
        const oneHour = 60 * 60 * 1000;
        if (Date.now() - priceData.timestamp < oneHour) {
          return priceData.discounted;
        } else {
          // Süre dolmuş, flag'leri temizle
          localStorage.removeItem('discount_popup_accepted');
          localStorage.removeItem('discount_popup_price');
        }
      }
      return basePrice;
    } catch (error) {
      console.error('Error getting final price:', error);
      return basePrice;
    }
  };

  const selectPlan = (planId: 'free' | 'pro') => {
    setSelectedPlan(planId);
  };

  const openPaymentModal = (price?: number) => {
    // Eğer showDiscountViaPopup aktifse ve kullanıcı popup'ı kabul ettiyse indirimli fiyatı kullan
    const finalPrice = price ? getFinalPrice(price) : price;
    setPaymentPrice(finalPrice);
    setPaymentDialogOpen(true);
  };

  return (
    <PaymentContext.Provider
      value={{
        initiateApplePay,
        initiateGooglePay,
        initiateCardPayment,
        selectPlan,
        openPaymentModal,
        isProcessing,
      }}
    >
      {children}
      <PaymentMethodDialog
        open={paymentDialogOpen}
        onClose={() => {
          setPaymentDialogOpen(false);
          setSelectedPlan(null);
          setPaymentPrice(undefined);
        }}
        plan={selectedPlan ? {
          name: selectedPlan === 'pro' ? 'Pro Plan' : 'Free Plan',
          price: paymentPrice || (selectedPlan === 'pro' ? 99.99 : 0),
        } : null}
      />
    </PaymentContext.Provider>
  );
}

export function usePayment() {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within PaymentProvider');
  }
  return context;
}

// Type declarations for Apple Pay and Google Pay
declare global {
  interface Window {
    ApplePaySession?: any;
    google?: {
      payments?: {
        api: {
          PaymentsClient: any;
        };
      };
    };
  }
}
