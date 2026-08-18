import { NativeModules } from 'react-native';

type KidNestSplashModule = {
  hide: () => Promise<void>;
};

export function hideNativeSplash(): void {
  const mod = NativeModules.KidNestSplash as KidNestSplashModule | undefined;
  void mod?.hide?.();
}
