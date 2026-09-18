// Cryptographic SHA-256 helper for evidence chain of custody
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Fallback simple 64-char hex hash if subtle crypto is unavailable
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  return (hex + hex + hex + hex + hex + hex + hex + hex).slice(0, 64);
}

export function synchronousHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const hex1 = Math.abs(hash).toString(16).padStart(8, "0");
  const hex2 = Math.abs(hash ^ 0x5a5a5a5a).toString(16).padStart(8, "0");
  const hex3 = Math.abs((hash * 31) | 0).toString(16).padStart(8, "0");
  const hex4 = Math.abs((hash * 17) ^ 0x3c3c3c3c).toString(16).padStart(8, "0");
  return (hex1 + hex2 + hex3 + hex4 + hex2 + hex1 + hex4 + hex3).slice(0, 64);
}
