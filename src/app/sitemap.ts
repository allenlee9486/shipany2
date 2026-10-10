import { MetadataRoute } from 'next';

import { envConfigs } from '@/config';
import { pagesSource, postsSource } from '@/core/docs/source';

const appUrl = (envConfigs.app_url || 'https://airumpelstiltskin.online').replace(
  /\/+$/,
  ''
);
const locales = ['en', 'zh'];

// static routes relative to the locale root; en is the default (no prefix)
const staticPaths: Array<{
  path: string;
  priority: number;
  changeFrequency: 'daily' | 'weekly' | 'monthly';
}> = [
  { path: '', priority: 1, changeFrequency: 'daily' },
  { path: 'pricing', priority: 0.9, changeFrequency: 'weekly' },
  { path: 'blog', priority: 0.8, changeFrequency: 'weekly' },
  { path: 'ai-zombie', priority: 0.9, changeFrequency: 'weekly' },
  { path: 'updates', priority: 0.6, changeFrequency: 'weekly' },
  { path: 'docs', priority: 0.6, changeFrequency: 'monthly' },
  { path: 'acceptable-use', priority: 0.4, changeFrequency: 'monthly' },
];

// routes disallowed in robots.ts are never listed
const disallowed = ['/privacy-policy', '/terms-of-service'];

function localeUrl(locale: string, path: string) {
  const prefix = locale === 'en' ? '' : `/${locale}`;
  return `${appUrl}${prefix}${path ? `/${path}` : ''}`;
}

function withAlternates(
  entry: MetadataRoute.Sitemap[number],
  path: string
): MetadataRoute.Sitemap[number] {
  return {
    ...entry,
    alternates: {
      languages: Object.fromEntries(
        locales.map((locale) => [locale, localeUrl(locale, path)])
      ),
    },
  };
}

// fumadocs prefixes the default locale ('/en/...') while the site serves
// default-locale pages without prefix — normalize to a plain path
function toPath(url: string): string {
  return url.replace(/^\/en(?=\/|$)/, '').replace(/^\/zh(?=\/|$)/, '').replace(/^\//, '');
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const sitemap: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();

  for (const { path, priority, changeFrequency } of staticPaths) {
    seen.add(path);
    sitemap.push(
      withAlternates(
        {
          url: localeUrl('en', path),
          lastModified: now,
          changeFrequency,
          priority,
        },
        path
      )
    );
  }

  // content pages from fumadocs: posts under /blog, legal pages under /
  // en and zh variants share one entry via hreflang alternates
  const contentPages = [...postsSource.getPages(), ...pagesSource.getPages()];
  for (const page of contentPages) {
    const path = toPath(page.url);
    if (!path || seen.has(path)) continue;
    if (disallowed.some((p) => path === p.replace(/^\//, ''))) continue;

    const data = page.data as any;
    const lastModified = data?.created_at ? new Date(data.created_at) : now;
    seen.add(path);
    sitemap.push(
      withAlternates(
        {
          url: localeUrl('en', path),
          lastModified,
          changeFrequency: 'monthly',
          priority: 0.6,
        },
        path
      )
    );
  }

  return sitemap;
}
