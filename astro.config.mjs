import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://jonysunny.github.io',
  base: '/wedding.invitation',
  build: {
    assets: 'assets'
  }
});