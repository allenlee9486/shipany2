import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getThemePage } from '@/core/theme';
import { envConfigs } from '@/config';
import { JsonLd } from '@/shared/blocks/common/json-ld';
import { DynamicPage } from '@/shared/types/blocks/landing';

export const revalidate = 3600;

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('pages.index');
  const tm = await getTranslations('common.metadata');

  // site + web application structured data
  const siteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: envConfigs.app_name || 'AI Rumpelstiltskin',
    url: envConfigs.app_url,
    inLanguage: locale,
  };
  const appLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tm('title'),
    description: tm('description'),
    url: envConfigs.app_url,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    inLanguage: locale,
    publisher: {
      '@type': 'Organization',
      name: envConfigs.app_name || 'AI Rumpelstiltskin',
    },
  };

  // get page data
  const page: DynamicPage = t.raw('page');

  // load page component
  const Page = await getThemePage('dynamic-page');

  return (
    <>
      <JsonLd data={siteLd} />
      <JsonLd data={appLd} />
      <Page locale={locale} page={page} />
    </>
  );
}
