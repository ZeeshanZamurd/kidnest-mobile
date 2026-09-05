import { NativeModules } from 'react-native';

/**
 * Reads the host from Metro's bundle URL — same machine the phone is connected to for dev.
 * Example: http://192.168.1.42:8088/index.bundle → 192.168.1.42
 */
export function getMetroDevHost(): string | null {
  try {
    const scriptURL: string | undefined = NativeModules.SourceCode?.scriptURL;
    if (!scriptURL || typeof scriptURL !== 'string') {
      return null;
    }

    if (scriptURL.startsWith('file://')) {
      return null;
    }

    const withoutProtocol = scriptURL.replace(/^[a-z]+:\/\//i, '');
    const hostPort = withoutProtocol.split('/')[0] ?? '';
    const host = hostPort.split(':')[0]?.trim();

    if (!host || host === 'localhost' || host === '127.0.0.1') {
      // Let resolveApiBaseUrl choose USB reverse / LAN / emulator — do not force 10.0.2.2 here
      return null;
    }

    return host;
  } catch {
    return null;
  }
}
