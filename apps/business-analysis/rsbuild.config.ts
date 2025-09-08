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
    overrideBrowserslist: [
      'iOS >= 9',
      'Android >= 4.4',
      'chrome >= 80',
      'last 2 versions',
      '> 0.2%',
      'not dead',
    ],
  },
  
});
