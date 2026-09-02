import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Pin the dev port so the Supabase "Redirect URLs" allow-list entry
  // (http://localhost:5173/reset-password) stays valid. strictPort makes Vite
  // fail loudly instead of silently moving to 5174 if 5173 is taken, which
  // would otherwise break the recovery redirect during local testing.
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    target: "es2020",
    sourcemap: false,
  },
});
