import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getThemePage } from '@/core/theme';
import { JsonLd } from '@/shared/blocks/common/json-ld';
import { buildPageMetadata } from '@/shared/lib/seo';
import { getLocalPage } from '@/shared/models/post';

export const revalidate = 3600;

// dynamic page metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  // 1. try to get static page metadata from
  // content/pages/**/*.mdx

  // static page slug
  const staticPageSlug =
    typeof slug === 'string' ? slug : (slug as string[]).join('/') || '';

  // filter invalid slug
  if (staticPageSlug.includes('.')) {
    return;
  }

  // get static page content
  const staticPage = await getLocalPage({ slug: staticPageSlug, locale });

  // return static page metadata
  if (staticPage) {
    return buildPageMetadata({
      locale,
      title: staticPage.title || '',
      description: staticPage.description || '',
      canonicalPath: `/${staticPageSlug}`,
    });
  }

  // 2. static page not found, try to get dynamic page metadata from
  // src/config/locale/messages/{locale}/pages/**/*.json

  // dynamic page slug
  const dynamicPageSlug =
    typeof slug === 'string' ? slug : (slug as string[]).join('.') || '';

  const messageKey = `pages.${dynamicPageSlug}`;
  const t = await getTranslations({ locale, namespace: messageKey });

  // return dynamic page metadata
  if (t.has('metadata')) {
    return buildPageMetadata({
      locale,
      title: t.raw('metadata.title'),
      description: t.raw('metadata.description'),
      canonicalPath: `/${staticPageSlug}`,
    });
  }

  // 3. return common metadata
  const tc = await getTranslations('common.metadata');

  return buildPageMetadata({
    locale,
    title: tc('title'),
    description: tc('description'),
    canonicalPath: `/${staticPageSlug}`,
  });
}

export default async function DynamicPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  // 1. try to get static page from
  // content/pages/**/*.mdx

  // static page slug
  const staticPageSlug =
    typeof slug === 'string' ? slug : (slug as string[]).join('/') || '';

  // filter invalid slug
  if (staticPageSlug.includes('.')) {
    return notFound();
  }

  // get static page content
  const staticPage = await getLocalPage({ slug: staticPageSlug, locale });

  // return static page
  if (staticPage) {
    const Page = await getThemePage('static-page');

    return <Page locale={locale} post={staticPage} />;
  }

  // 2. static page not found
  // try to get dynamic page content from
  // src/config/locale/messages/{locale}/pages/**/*.json

  // dynamic page slug
  const dynamicPageSlug =
    typeof slug === 'string' ? slug : (slug as string[]).join('.') || '';

  const messageKey = `pages.${dynamicPageSlug}`;

  try {
    const t = await getTranslations({ locale, namespace: messageKey });

    // return dynamic page
    if (t.has('page')) {
      const page = t.raw('page');

      // FAQ structured data from the page's own faq section
      const faqItems = page?.sections?.faq?.items;
      const faqLd =
        Array.isArray(faqItems) && faqItems.length > 0
          ? {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqItems.map(
                (item: { question?: string; answer?: string }) => ({
                  '@type': 'Question',
                  name: item.question || '',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: item.answer || '',
                  },
                })
              ),
            }
          : null;

      const Page = await getThemePage('dynamic-page');
      return (
        <>
          {faqLd ? <JsonLd data={faqLd} /> : null}
          <Page locale={locale} page={page} />
        </>
      );
    }
  } catch (error) {
    // ignore error if translation not found
    return notFound();
  }

  // 3. page not found
  return notFound();
}
