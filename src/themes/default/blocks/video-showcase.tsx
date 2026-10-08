'use client';

import { motion } from 'framer-motion';

import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

type VideoCard = {
  title?: string;
  description?: string;
  video?: { src?: string; poster?: string };
};

// Editorial dark band: ink background, display headline, bordered video row.
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
      className={cn(
        'bg-foreground text-background py-16 md:py-24',
        section.className,
        className
      )}
    >
      <div className="container">
        <motion.div
          className="max-w-3xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {section.label && (
            <p className="text-primary text-xs font-bold tracking-[0.22em] uppercase">
              {section.label}
            </p>
          )}
          <h2 className="mt-3 break-words text-3xl leading-[0.95] font-display uppercase tracking-tight text-balance sm:text-4xl md:text-6xl">
            {section.title}
          </h2>
          {section.description && (
            <p className="text-background/70 mt-4 max-w-2xl text-base font-medium text-balance">
              {section.description}
            </p>
          )}
        </motion.div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {videos.map((item, index) => (
            <motion.figure
              key={index}
              className="border-background/25 border"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
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
                <figcaption className="space-y-1.5 p-4">
                  <h3 className="text-sm font-bold tracking-wide uppercase">
                    {item.title}
                  </h3>
                  <p className="text-background/60 text-sm">
                    {item.description}
                  </p>
                </figcaption>
              )}
            </motion.figure>
          ))}
        </div>

        {items.length > 0 && (
          <motion.div
            className="border-background/25 mt-12 grid grid-cols-2 gap-6 border-t pt-10 lg:grid-cols-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {items.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="text-primary text-xl font-display uppercase md:text-2xl">
                  {item.title}
                </div>
                <p className="text-background/60 text-sm">{item.description}</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
