export function extractYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    // youtu.be/ID
    if (parsed.hostname === "youtu.be") return parsed.pathname.slice(1);
    // youtube.com/watch?v=ID
    if (parsed.searchParams.has("v")) return parsed.searchParams.get("v");
    // youtube.com/embed/ID
    const embedMatch = parsed.pathname.match(/\/embed\/([^/?]+)/);
    if (embedMatch) return embedMatch[1];
    // youtube.com/shorts/ID
    const shortsMatch = parsed.pathname.match(/\/shorts\/([^/?]+)/);
    if (shortsMatch) return shortsMatch[1];
  } catch {
    // Not a valid URL — try regex fallback
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/,
    );
    if (match) return match[1];
  }
  return null;
}
