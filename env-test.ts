
const getEnv = (key: string): string | undefined => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) { /* ignore */ }

  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) { /* ignore */ }

  return undefined;
};

const apiKey = getEnv('VITE_FB_API_KEY');
const projectId = getEnv('VITE_FB_PROJECT_ID');

console.log("--- Environment Variable Test ---");
console.log("API Key Present:", !!apiKey);
console.log("Project ID:", projectId || "MISSING");

if (!apiKey) {
    console.error("❌ CRITICAL: .env file is not loaded. VITE_FB_API_KEY is missing.");
} else {
    console.log("✅ Environment configuration loaded successfully.");
}
