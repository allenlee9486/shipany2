'use client';

import { motion } from 'framer-motion';
import { CloudUpload } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

// Static preview of the planned generator workspace. The product is in
// prototype: no upload, prompt or generation actually runs here.
export function GeneratorPreview({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) {
  const s = section as any;
  const formats: string[] = s.formats ?? [];
  const reference = s.reference_video ?? {};

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

        <motion.div
          className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <div className="border-border/40 bg-card overflow-hidden rounded-xl border shadow-sm">
            <div className="border-border/40 flex items-center justify-between border-b px-4 py-2.5">
              <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {s.reference_label}
              </span>
            </div>
            <video
              className="aspect-video w-full bg-black object-cover"
              src={reference.src}
              poster={reference.poster}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
          </div>

          <div className="border-border/40 bg-card space-y-5 rounded-xl border p-5 shadow-sm">
            <div
              className="border-border text-muted-foreground flex min-h-28 cursor-not-allowed flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center"
              aria-disabled="true"
            >
              <CloudUpload className="size-6" />
              <span className="text-sm">{s.upload_placeholder}</span>
            </div>

            <div className="space-y-2">
              <span className="text-foreground text-sm font-medium">
                {s.prompt_label}
              </span>
              <textarea
                className="border-border text-muted-foreground placeholder:text-muted-foreground/60 w-full cursor-not-allowed resize-none rounded-lg border p-3 text-sm"
                rows={4}
                placeholder={s.prompt_placeholder}
                readOnly
                aria-disabled="true"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {formats.map((format: string, idx: number) => (
                <span
                  key={format}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs',
                    idx === 0
                      ? 'border-primary/60 text-primary bg-primary/10 font-medium'
                      : 'text-muted-foreground border-border'
                  )}
                >
                  {format}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button disabled className="cursor-not-allowed">
                {s.button_title}
              </Button>
              <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">
                {s.badge}
              </span>
            </div>

            {s.note && (
              <p className="text-muted-foreground text-xs">{s.note}</p>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
