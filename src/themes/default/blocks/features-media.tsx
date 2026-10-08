'use client';

import { motion } from 'framer-motion';

import { LazyImage, SmartIcon } from '@/shared/blocks/common';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

export function FeaturesMedia({ section }: { section: Section }) {
  const imagePosition = section.image_position || 'left';
  const isImageRight = imagePosition === 'right';

  return (
    <section
      id={section.id || section.name}
      className={cn('py-16 md:py-24', section.className)}
    >
      <div className="container flex flex-col items-center justify-center space-y-8 px-6 md:space-y-16">
        <motion.div
          className={cn(
            'grid items-center gap-8 sm:grid-cols-2 md:gap-12 lg:gap-20',
            isImageRight &&
              'sm:[&>*:first-child]:order-2 sm:[&>*:last-child]:order-1'
          )}
          initial={{
            opacity: 0,
            y: 30,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1] as const,
          }}
        >
          <motion.div
            className="border-border border"
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.5,
              delay: 0.2,
              ease: [0.22, 1, 0.36, 1] as const,
            }}
          >
            <LazyImage
              src={section.image?.src ?? ''}
              className=""
              alt={section.image?.alt ?? ''}
            />
          </motion.div>

          <motion.div
            className="relative space-y-4"
            initial={{ opacity: 0, x: isImageRight ? -20 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.5,
              delay: 0.3,
              ease: [0.22, 1, 0.36, 1] as const,
            }}
          >
            {section.label && (
              <p className="text-muted-foreground text-xs font-bold tracking-[0.22em] uppercase">
                {section.label}
              </p>
            )}
            <h2 className="text-3xl leading-[0.95] font-display uppercase tracking-tight text-balance md:text-4xl">
              {section.title}
            </h2>
            <p className="text-muted-foreground text-base font-medium">
              {section.description}
            </p>
            <div className="border-border mt-8 divide-y divide-border border">
              {section.items?.map((item) => (
                <div
                  key={item.title}
                  className="hover:bg-muted flex items-start gap-3 p-4 transition-colors"
                >
                  <SmartIcon
                    name={item.icon as string}
                    size={18}
                    className="text-primary mt-0.5 shrink-0"
                  />
                  <div>
                    <h3 className="text-xs font-bold tracking-[0.12em] uppercase">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
