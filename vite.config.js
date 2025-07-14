import { defineConfig } from 'vite';

export default defineConfig({
  root: '.', // Chỉ định thư mục gốc chứa index.html
  build: {
    outDir: 'dist', // Thư mục output khi build
    rollupOptions: {
      input: './index.html', // Xác định file index.html
    },
  },
});