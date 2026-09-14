import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: [
        { find: 'firebase/app', replacement: path.resolve(__dirname, 'src/lib/firebase-mock.ts') },
        { find: 'firebase/auth', replacement: path.resolve(__dirname, 'src/lib/firebase-mock.ts') },
        { find: 'firebase/firestore', replacement: path.resolve(__dirname, 'src/lib/firebase-mock.ts') },
        { find: 'firebase/storage', replacement: path.resolve(__dirname, 'src/lib/firebase-mock.ts') },
        { find: '@', replacement: path.resolve(__dirname, '.') }
      ]
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
