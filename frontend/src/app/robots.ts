import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/private/'],
    },
    sitemap: 'https://fiyield.com/sitemap.xml',
  }
}

