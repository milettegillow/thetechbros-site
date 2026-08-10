// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  // Old URLs are in circulation on print, QR codes and email footers — these
  // are permanent server-side 301s, emitted into the Vercel routing config.
  redirects: {
    '/apply/accelerator': { status: 301, destination: '/accelerator' },
    '/apply/faq': { status: 301, destination: '/accelerator#faq' },
    '/apply/join-community': { status: 301, destination: '/community' },
    '/apply': { status: 301, destination: '/accelerator' },
    '/partner/companies': { status: 301, destination: '/partners' },
    '/partner/investors': { status: 301, destination: '/partners' },
    '/partner/universities': { status: 301, destination: '/universities' },
    '/partners/universities': { status: 301, destination: '/universities' },
    '/partner': { status: 301, destination: '/partners' },
    '/team': { status: 301, destination: '/about#team' },
    '/merch': { status: 301, destination: '/' },
  },
});
