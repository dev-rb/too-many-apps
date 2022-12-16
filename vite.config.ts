import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import path from 'path';
import Unocss from 'unocss/vite';

export default defineConfig({
  plugins: [solidPlugin(), Unocss({})],
  resolve: {
    alias: {
      '~/': path.join(__dirname, 'src') + '/',
    },
  },
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
});
