import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kinship \u2014 One place for your household',
    short_name: 'Kinship',
    description: 'Track everything your family owns, owes, and needs to do.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#f5f5f7',
    theme_color: '#5b76fe',
    icons: [
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
