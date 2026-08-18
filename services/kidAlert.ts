export type KidAlertButtonStyle = 'default' | 'cancel' | 'destructive';

export type KidAlertButton = {
  text: string;
  style?: KidAlertButtonStyle;
  onPress?: () => void;
};

export type KidAlertVariant = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export type KidAlertConfig = {
  title: string;
  message?: string;
  buttons?: KidAlertButton[];
  variant?: KidAlertVariant;
};

type KidAlertHandler = (config: KidAlertConfig) => void;

let handler: KidAlertHandler | null = null;

export function registerKidAlertHandler(next: KidAlertHandler | null) {
  handler = next;
}

function inferVariant(title: string, buttons?: KidAlertButton[]): KidAlertVariant {
  const t = title.toLowerCase();
  if (t.includes('?') || buttons?.some((b) => b.style === 'destructive')) return 'confirm';
  if (
    t.includes('subscribed') ||
    t.includes('applied') ||
    t.includes('success') ||
    t.includes('done') ||
    t.includes('yay')
  ) {
    return 'success';
  }
  if (
    t.includes('fail') ||
    t.includes('invalid') ||
    t.includes('could not') ||
    t.includes('error') ||
    t.includes('payment failed')
  ) {
    return 'error';
  }
  if (t.includes('select') || t.includes('enter') || t.includes('no child')) return 'warning';
  return 'info';
}

export function kidAlert(
  title: string,
  message?: string,
  buttons?: KidAlertButton[],
  options?: { variant?: KidAlertVariant },
) {
  const config: KidAlertConfig = {
    title,
    message,
    buttons: buttons?.length ? buttons : [{ text: 'OK' }],
    variant: options?.variant ?? inferVariant(title, buttons),
  };
  if (handler) {
    handler(config);
    return;
  }
  // Fallback before provider mounts (dev safety)
  console.warn('[KidAlert]', title, message);
}

/** Drop-in replacement for Alert.alert */
export const KidAlert = { alert: kidAlert };
