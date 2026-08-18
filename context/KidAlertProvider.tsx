import React, { useCallback, useEffect, useRef, useState } from 'react';
import KidAlertModal from '../components/ui/KidAlertModal';
import type { KidAlertConfig } from '../services/kidAlert';
import { registerKidAlertHandler } from '../services/kidAlert';

export function KidAlertProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<KidAlertConfig | null>(null);
  const [visible, setVisible] = useState(false);
  const queueRef = useRef<KidAlertConfig[]>([]);
  const closingRef = useRef(false);

  const showNext = useCallback(() => {
    const next = queueRef.current.shift();
    if (next) {
      setCurrent(next);
      setVisible(true);
    } else {
      setCurrent(null);
      setVisible(false);
      closingRef.current = false;
    }
  }, []);

  const enqueue = useCallback(
    (config: KidAlertConfig) => {
      if (!visible && !current && !closingRef.current) {
        setCurrent(config);
        setVisible(true);
        return;
      }
      queueRef.current.push(config);
    },
    [current, visible],
  );

  useEffect(() => {
    registerKidAlertHandler(enqueue);
    return () => registerKidAlertHandler(null);
  }, [enqueue]);

  const dismiss = useCallback(() => {
    closingRef.current = true;
    setVisible(false);
    setTimeout(showNext, 140);
  }, [showNext]);

  return (
    <>
      {children}
      <KidAlertModal visible={visible} config={current} onDismiss={dismiss} />
    </>
  );
}
