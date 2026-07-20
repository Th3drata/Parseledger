import type { MetadataRoute } from 'next';
import { BANKS, COMPETITORS, FORMATS, SITE_URL, convertSlug } from '@/lib/seo-banks';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPaths = ['', '/pricing', '/security', '/xero', '/quickbooks'];

  const convertPaths = BANKS.flatMap((bank) =>
    FORMATS.map((format) => `/convert/${convertSlug(bank, format)}`),
  );

  const alternativePaths = COMPETITORS.map((c) => `/alternatives/${c.slug}`);

  return [...staticPaths, ...convertPaths, ...alternativePaths].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : path.startsWith('/convert/') ? 0.7 : 0.8,
  }));
}
