export function validateUrl(url: string): string | null {
  if (!url.trim()) return "Vui lòng nhập URL RPC";
  try {
    const parsed = new URL(url.trim());
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "URL RPC phải dùng http hoặc https";
    }
  } catch {
    return "URL không hợp lệ";
  }
  return null;
}
