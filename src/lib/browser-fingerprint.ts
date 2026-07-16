interface FingerprintContext {
  userAgent: string;
  language: string;
  platform: string;
  timezone: string;
  screenWidth: number;
  screenHeight: number;
  colorDepth: number;
  deviceMemory: string;
  hardwareConcurrency: string;
  cookieEnabled: string;
}

function toFingerprintContext(): FingerprintContext {
  const nav = window.navigator;
  const screen = window.screen;

  return {
    userAgent: nav.userAgent,
    language: nav.language || "",
    platform: nav.platform || "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    screenWidth: screen.width,
    screenHeight: screen.height,
    colorDepth: screen.colorDepth,
    deviceMemory: String((nav as Navigator & { deviceMemory?: number }).deviceMemory ?? ""),
    hardwareConcurrency: String(nav.hardwareConcurrency ?? ""),
    cookieEnabled: String(nav.cookieEnabled),
  };
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function getBrowserFingerprintHash(): Promise<{ fingerprintHash: string; userAgent: string }> {
  const context = toFingerprintContext();
  const payload = JSON.stringify(context);

  return {
    fingerprintHash: await sha256Hex(payload),
    userAgent: context.userAgent,
  };
}
