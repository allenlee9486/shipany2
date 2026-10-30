import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getThemePage } from '@/core/theme';
import { envConfigs } from '@/config';
import { Empty } from '@/shared/blocks/common';
import { JsonLd } from '@/shared/blocks/common/json-ld';
import { buildPageMetadata } from '@/shared/lib/seo';
import { getPost } from '@/shared/models/post';
import { DynamicPage } from '@/shared/types/blocks/landing';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations('pages.blog.metadata');

  const canonicalPath = `/blog/${slug}`;
  const post = await getPost({ slug, locale });
  if (!post) {
    return buildPageMetadata({
      locale,
      title: `${slug} | ${t('title')}`,
      description: t('description'),
      canonicalPath,
    });
  }

  return buildPageMetadata({
    locale,
    title: `${post.title} | ${t('title')}`,
    description: post.description,
    canonicalPath,
    ogType: 'article',
    publishedTime: post.created_at
      ? new Date(post.created_at).toISOString()
      : undefined,
  });
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = await getPost({ slug, locale });

  if (!post) {
    return <Empty message={`Post not found`} />;
  }

  // article structured data for rich results
  const canonicalUrl = `${envConfigs.app_url}/blog/${post.slug}`;
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    ...(post.created_at
      ? { datePublished: new Date(post.created_at).toISOString() }
      : {}),
    inLanguage: locale,
    author: {
      '@type': 'Person',
      name: post.author_name || envConfigs.app_name || 'AI Rumpelstiltskin',
    },
    publisher: {
      '@type': 'Organization',
      name: envConfigs.app_name || 'AI Rumpelstiltskin',
    },
    mainEntityOfPage: canonicalUrl,
    image: `${envConfigs.app_url}${envConfigs.app_preview_image}`,
  };

  // build page sections
  const page: DynamicPage = {
    sections: {
      blogDetail: {
        block: 'blog-detail',
        data: {
          post,
        },
      },
    },
  };

  const Page = await getThemePage('dynamic-page');

  return (
    <>
      <JsonLd data={articleLd} />
      <Page locale={locale} page={page} />
    </>
  );
}
