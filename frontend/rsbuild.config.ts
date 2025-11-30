import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/rspack';

export default defineConfig({
  plugins: [pluginReact()],
  output: {
    distPath: { root: '../build/public' },
    cleanDistPath: {
      enable: true,
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/ws': 'http://localhost:3000',
      '/api': 'http://localhost:3000',
      '/display': 'http://localhost:8080',
    },
  },
  html: {
    title: 'Elysia Full-Stack Starter',
  },
  tools: {
    rspack: {
      plugins: [
        tanstackRouter({
          target: 'react',
          autoCodeSplitting: true,
        }),
      ],
    },
  },
});
