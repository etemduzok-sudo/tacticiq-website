/**
 * Cross-platform Alert Helper
 * Web'de window.alert yerine in-app toast/overlay gösterir.
 * Native'de Alert.alert kullanır.
 */
import { Alert, Platform } from 'react-native';

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

// Web toast event sistemi - componentler subscribe olabilir
type ToastData = { title: string; message?: string; type: 'info' | 'error' | 'success' };
type ToastListener = (data: ToastData) => void;
const toastListeners: Set<ToastListener> = new Set();

export function subscribeToast(listener: ToastListener): () => void {
  toastListeners.add(listener);
  return () => { toastListeners.delete(listener); };
}

function emitToast(data: ToastData) {
  toastListeners.forEach(fn => fn(data));
}

/**
 * Cross-platform alert fonksiyonu
 * Web'de confirm dialog (2 butonlu) veya in-app toast (tek butonlu) kullanır.
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[]
): void {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
      const fullMessage = message ? `${title}\n\n${message}` : title;
      // eslint-disable-next-line no-restricted-globals
      const result = window.confirm(fullMessage);
      
      if (result) {
        const confirmButton = buttons.find(b => b.style !== 'cancel');
        confirmButton?.onPress?.();
      } else {
        const cancelButton = buttons.find(b => b.style === 'cancel');
        cancelButton?.onPress?.();
      }
    } else {
      emitToast({ title, message, type: 'info' });
      buttons?.[0]?.onPress?.();
    }
  } else {
    Alert.alert(title, message, buttons);
  }
}

/**
 * Cross-platform confirm fonksiyonu
 */
export function showConfirm(
  title: string,
  message?: string,
  onConfirm?: () => void,
  onCancel?: () => void,
  confirmText: string = 'Evet',
  cancelText: string = 'İptal'
): void {
  if (Platform.OS === 'web') {
    const fullMessage = message ? `${title}\n\n${message}` : title;
    // eslint-disable-next-line no-restricted-globals
    const result = window.confirm(fullMessage);
    
    if (result) {
      onConfirm?.();
    } else {
      onCancel?.();
    }
  } else {
    Alert.alert(title, message, [
      { text: cancelText, style: 'cancel', onPress: onCancel },
      { text: confirmText, style: 'default', onPress: onConfirm },
    ]);
  }
}

/**
 * Basit bilgi mesajı göster (tek butonlu)
 * Web'de in-app toast, Native'de Alert.alert
 */
export function showInfo(title: string, message?: string, onClose?: () => void): void {
  if (Platform.OS === 'web') {
    emitToast({ title, message, type: 'info' });
    onClose?.();
  } else {
    Alert.alert(title, message, [{ text: 'Tamam', onPress: onClose }]);
  }
}

/**
 * Hata mesajı göster
 */
export function showError(title: string, message?: string, onClose?: () => void): void {
  if (Platform.OS === 'web') {
    emitToast({ title, message: message || 'Bir hata oluştu. Lütfen tekrar deneyin.', type: 'error' });
    onClose?.();
  } else {
    Alert.alert(title, message || 'Bir hata oluştu. Lütfen tekrar deneyin.', [{ text: 'Tamam', onPress: onClose }]);
  }
}

/**
 * Başarı mesajı göster
 */
export function showSuccess(title: string, message?: string, onClose?: () => void): void {
  if (Platform.OS === 'web') {
    emitToast({ title, message, type: 'success' });
    onClose?.();
  } else {
    Alert.alert(title, message, [{ text: 'Tamam', onPress: onClose }]);
  }
}
