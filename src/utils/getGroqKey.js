export async function getGroqApiKey() {
  // Try Vite environment variable first
  if (import.meta.env.VITE_GROQ_API_KEY) {
    return import.meta.env.VITE_GROQ_API_KEY;
  }
  
  // Try fetching the static env/.env file
  const paths = ['env/.env', './env/.env', '/env/.env', '../env/.env'];
  for (const p of paths) {
    try {
      const res = await fetch(p);
      if (res.ok) {
        const text = await res.text();
        const m = text.match(/^\s*GROQ_API_KEY\s*=\s*(.+)\s*$/m);
        if (m && m[1]) {
          return m[1].trim();
        }
      }
    } catch (e) {
      // fail silently and try next path
    }
  }
  return null;
}
