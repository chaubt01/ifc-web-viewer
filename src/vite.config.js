import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/nextcloud': {
        target: 'http://192.168.1.9:30027', // ← địa chỉ IP máy chạy Nextcloud
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nextcloud/, '/s/EFyP8JafKFSQE26'), // ← mã chia sẻ
      },
    },
  },
});
