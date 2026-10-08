'use client';

import { motion } from 'framer-motion';

import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

type VideoCard = {
  title?: string;
  description?: string;
  video?: { src?: string; poster?: string };
};

export function VideoShowcase({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) {
  const videos: VideoCard[] = ((section as any).videos ?? []) as VideoCard[];
  const items = section.items ?? [];

  return (
    <section
      id={section.id || section.name}
      className={cn('py-16 md:py-24', section.className, className)}
    >
      <div className="container">
        <motion.div
          className="mx-auto mb-12 max-w-3xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {section.label && (
            <span className="text-primary mb-4 block text-sm font-medium tracking-wider uppercase">
              {section.label}
            </span>
          )}
          <h2 className="text-foreground text-3xl font-semibold text-balance md:text-4xl">
            {section.title}
          </h2>
          {section.description && (
            <p className="text-muted-foreground mt-4 text-md text-balance">
              {section.description}
            </p>
          )}
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {videos.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="border-border/40 bg-card overflow-hidden rounded-xl border shadow-sm">
                <video
                  className="aspect-video w-full bg-black object-cover"
                  src={item.video?.src}
                  poster={item.video?.poster}
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                  preload="metadata"
                />
                {(item.title || item.description) && (
                  <div className="space-y-1.5 p-4">
                    <h3 className="text-foreground text-base font-semibold">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {item.description}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {items.length > 0 && (
          <motion.div
            className="border-border/60 mt-12 grid grid-cols-2 gap-6 border-t pt-10 lg:grid-cols-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {items.map((item, idx) => (
              <div key={idx} className="space-y-1 text-center">
                <div className="text-primary text-2xl font-bold">
                  {item.title}
                </div>
                <p className="text-muted-foreground text-sm">
                  {item.description}
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
