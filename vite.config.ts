import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to 'VITE_' to load all env vars starting with VITE_.
  const env = loadEnv(mode, (process as any).cwd(), 'VITE_');

  return {
    plugins: [react()],
    envPrefix: 'VITE_',
    define: {
      // We also inject them into process.env for compatibility if needed, 
      // though the main fix is in lib/db.ts fallbacks.
      'process.env': JSON.stringify(env)
    }
  };
});