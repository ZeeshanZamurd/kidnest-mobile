#!/usr/bin/env node
/**
 * Detects this machine's LAN IPv4 and writes config/dev-host.generated.ts
 * so the mobile app can reach the local KidNest API without hardcoding an IP.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const OUT_FILE = path.join(__dirname, '..', 'config', 'dev-host.generated.ts');

const PREFERRED_IFACES = ['en0', 'en1', 'wlan0', 'eth0', 'Ethernet', 'Wi-Fi'];

function isPrivateIpv4(address) {
  if (!address || address.includes(':')) return false;
  if (address.startsWith('127.')) return false;
  if (address.startsWith('10.')) return true;
  if (address.startsWith('192.168.')) return true;
  const parts = address.split('.').map(Number);
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  return false;
}

function pickLanIpv4() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const [name, entries] of Object.entries(interfaces)) {
    if (!entries) continue;
    for (const entry of entries) {
      if (entry.family !== 'IPv4' && entry.family !== 4) continue;
      if (entry.internal) continue;
      if (!isPrivateIpv4(entry.address)) continue;
      const priority = PREFERRED_IFACES.some((iface) => name.toLowerCase().includes(iface.toLowerCase()))
        ? 0
        : 1;
      candidates.push({ address: entry.address, name, priority });
    }
  }

  candidates.sort((a, b) => a.priority - b.priority || a.address.localeCompare(b.address));
  return candidates[0]?.address ?? '127.0.0.1';
}

function main() {
  const ip = pickLanIpv4();
  const content = `/**
 * AUTO-GENERATED — do not edit.
 * Run: npm run detect-host (or npm start / npm run android, which run this first)
 */
export const DEV_HOST_IP = '${ip}';
export const DEV_HOST_DETECTED_AT = '${new Date().toISOString()}';
`;

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, content, 'utf8');
  console.log(`[kidnest] Dev host IP: ${ip} → config/dev-host.generated.ts`);
}

main();
