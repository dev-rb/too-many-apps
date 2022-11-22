import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import path from 'path';

export default defineConfig({
	plugins: [solidPlugin()],
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
