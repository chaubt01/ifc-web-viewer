import { defineConfig } from 'vite';

export default defineConfig({
  root: '.', // thư mục gốc
  build: {
    target: 'esnext', // 👈 hỗ trợ top-level await
    outDir: 'dist', // thư mục build output
    rollupOptions: {
      input: './index.html',
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
