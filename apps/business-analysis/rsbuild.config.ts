import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/rspack'
import tailwindcss from 'tailwindcss';

export default defineConfig({
  plugins: [pluginReact()],
  tools: {
    postcss: {
      postcssOptions: {
        plugins: [
          tailwindcss({
            content: ['./src/**/*.{html,js,ts,jsx,tsx}'],
            // ...other options
          }),
        ],
      },
    },
    rspack: {
      plugins: [
        tanstackRouter({
          target: 'react',
          autoCodeSplitting: true,
        }),
      ],
    },
  },
  output: {
    assetPrefix: process.env.STATIC_BASE_PATH || '/',
    overrideBrowserslist:['chrome >= 80', 'edge >= 80', 'firefox >= 78', 'safari >= 14']
  },
  
});
