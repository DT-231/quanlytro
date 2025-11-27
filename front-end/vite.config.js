import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
// git init
// git add .
// git commit -m "first commit"
// git branch -M main
// git remote add origin https://github.com/DT-231/QuanLyTro.git
// git push -u origin main