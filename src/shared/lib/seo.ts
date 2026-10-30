import { getTranslations, setRequestLocale } from 'next-intl/server';

import { envConfigs } from '@/config';
import { defaultLocale, locales } from '@/config/locale';

// get metadata for page component
export function getMetadata(
  options: {
    title?: string;
    description?: string;
    keywords?: string;
    metadataKey?: string;
    canonicalUrl?: string; // relative path or full url
    imageUrl?: string;
    appName?: string;
    noIndex?: boolean;
  } = {}
) {
  return async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }) {
    const { locale } = await params;
    setRequestLocale(locale);

    // passed metadata
    const passedMetadata = {
      title: options.title,
      description: options.description,
      keywords: options.keywords,
    };

    // default metadata
    const defaultMetadata = await getTranslatedMetadata(
      defaultMetadataKey,
      locale
    );

    // translated metadata
    let translatedMetadata: any = {};
    if (options.metadataKey) {
      translatedMetadata = await getTranslatedMetadata(
        options.metadataKey,
        locale
      );
    }

    // canonical url
    const canonicalUrl = await getCanonicalUrl(
      options.canonicalUrl || '',
      locale || ''
    );

    const title =
      passedMetadata.title || translatedMetadata.title || defaultMetadata.title;
    const description =
      passedMetadata.description ||
      translatedMetadata.description ||
      defaultMetadata.description;

    // image url
    let imageUrl = options.imageUrl || envConfigs.app_preview_image;
    if (imageUrl.startsWith('http')) {
      imageUrl = imageUrl;
    } else {
      imageUrl = `${envConfigs.app_url}${imageUrl}`;
    }

    // app name
    let appName = options.appName;
    if (!appName) {
      appName = envConfigs.app_name || '';
    }

    return {
      title:
        passedMetadata.title ||
        translatedMetadata.title ||
        defaultMetadata.title,
      description:
        passedMetadata.description ||
        translatedMetadata.description ||
        defaultMetadata.description,
      keywords:
        passedMetadata.keywords ||
        translatedMetadata.keywords ||
        defaultMetadata.keywords,
      alternates: {
        canonical: canonicalUrl,
        languages: await buildLanguageAlternates(options.canonicalUrl || '/'),
      },

      openGraph: {
        type: 'website',
        locale: locale,
        url: canonicalUrl,
        title,
        description,
        siteName: appName,
        images: [imageUrl.toString()],
      },

      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl.toString()],
        site: envConfigs.app_url,
      },

      robots: {
        index: options.noIndex ? false : true,
        follow: options.noIndex ? false : true,
      },
    };
  };
}

const defaultMetadataKey = 'common.metadata';

async function getTranslatedMetadata(metadataKey: string, locale: string) {
  setRequestLocale(locale);
  const t = await getTranslations(metadataKey);

  return {
    title: t.has('title') ? t('title') : '',
    description: t.has('description') ? t('description') : '',
    keywords: t.has('keywords') ? t('keywords') : '',
  };
}

async function getCanonicalUrl(canonicalUrl: string, locale: string) {
  if (!canonicalUrl) {
    canonicalUrl = '/';
  }

  if (canonicalUrl.startsWith('http')) {
    // full url
    canonicalUrl = canonicalUrl;
  } else {
    // relative path
    if (!canonicalUrl.startsWith('/')) {
      canonicalUrl = `/${canonicalUrl}`;
    }

    canonicalUrl = `${envConfigs.app_url}${
      !locale || locale === defaultLocale ? '' : `/${locale}`
    }${canonicalUrl}`;

    if (locale !== defaultLocale && canonicalUrl.endsWith('/')) {
      canonicalUrl = canonicalUrl.slice(0, -1);
    }
  }

  return canonicalUrl;
}

// hreflang alternates for a relative path: one entry per supported locale
// (default locale without prefix), x-default pointing at the default locale
async function buildLanguageAlternates(path: string) {
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = await getCanonicalUrl(path, loc);
  }
  languages['x-default'] = await getCanonicalUrl(path, defaultLocale);
  return languages;
}

// full page-level metadata: per-page OG/twitter (Next.js inherits layout
// openGraph as-is unless the page defines its own) + hreflang alternates
export async function buildPageMetadata(options: {
  locale: string;
  title: string;
  description?: string;
  canonicalPath: string; // relative path, like '/blog/xxx'
  keywords?: string;
  imageUrl?: string;
  ogType?: 'website' | 'article';
  publishedTime?: string;
  noIndex?: boolean;
}) {
  const { locale } = options;
  setRequestLocale(locale);

  const path = options.canonicalPath || '/';
  const canonicalUrl = await getCanonicalUrl(path, locale);

  let imageUrl = options.imageUrl || envConfigs.app_preview_image;
  if (!imageUrl.startsWith('http')) {
    imageUrl = `${envConfigs.app_url}${imageUrl}`;
  }

  const appName = envConfigs.app_name || '';
  const title = options.title;
  const description = options.description || '';

  return {
    title,
    description,
    keywords: options.keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: await buildLanguageAlternates(path),
    },
    openGraph: {
      type: options.ogType || ('website' as const),
      locale: locale,
      url: canonicalUrl,
      title,
      description,
      siteName: appName,
      images: [imageUrl.toString()],
      ...(options.ogType === 'article' && options.publishedTime
        ? { publishedTime: options.publishedTime }
        : {}),
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
      images: [imageUrl.toString()],
      site: envConfigs.app_url,
    },
    robots: {
      index: options.noIndex ? false : true,
      follow: options.noIndex ? false : true,
    },
  };
}
