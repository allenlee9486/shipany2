'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Play,
  Upload,
  X,
} from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

type UploadZone = {
  title?: string;
  hint?: string;
  action?: string;
  accept?: string;
};

type ExampleVideo = {
  title?: string;
  description?: string;
  video?: { src?: string; poster?: string };
};

// Static preview of the planned generator workspace. The product is in
// prototype: files stay in the browser, nothing is uploaded, and the CTA
// opens a "coming soon" email capture instead of running a generation.
export function GeneratorPreview({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) {
  const s = section as any;
  const workspace = s.workspace ?? {};
  const examples = s.examples ?? {};
  const uploads: UploadZone[] = workspace.uploads ?? [];
  const tabs: string[] = examples.tabs ?? [];
  const videos: ExampleVideo[] = examples.videos ?? [];

  const [tab, setTab] = useState(0);
  const [videoIndex, setVideoIndex] = useState(0);
  const currentVideo = videos[videoIndex] ?? {};

  // locally "selected" files: zone index -> file name (never uploaded)
  const [files, setFiles] = useState<Record<number, string>>({});
  const fileInputs = useRef<(HTMLInputElement | null)[]>([]);
  const hasFiles = Object.values(files).some(Boolean);

  // coming soon modal
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen]);

  const handleFile = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFiles((prev) => ({ ...prev, [idx]: file.name }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <section
      id={section.id || section.name}
      className={cn('py-16 md:py-24', section.className, className)}
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
            <p className="text-muted-foreground text-xs font-bold tracking-[0.22em] uppercase">
              {section.label}
            </p>
          )}
          <h2 className="mt-3 break-words text-4xl leading-[0.95] font-display uppercase tracking-tight text-balance sm:text-5xl md:text-6xl">
            {section.title}
          </h2>
          {section.description && (
            <p className="text-muted-foreground mt-4 max-w-2xl text-base font-medium text-balance">
              {section.description}
            </p>
          )}
        </motion.div>

        <motion.div
          className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,26rem)_1fr]"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          {/* left: workspace / settings card */}
          <div className="border-border bg-card relative flex flex-col border p-6 md:p-7">
            {s.badge && (
              <span className="border-border text-muted-foreground absolute top-6 right-6 border px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] uppercase md:top-7 md:right-7">
                {s.badge}
              </span>
            )}

            {workspace.title && (
              <h3 className="text-xl font-bold tracking-tight">
                {workspace.title}
              </h3>
            )}
            {workspace.description && (
              <p className="text-muted-foreground mt-1.5 text-sm">
                {workspace.description}
              </p>
            )}

            {uploads.length > 0 && (
              <div
                className={cn(
                  'mt-6 grid gap-3',
                  uploads.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
                )}
              >
                {uploads.map((zone, idx) => {
                  const fileName = files[idx];
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => fileInputs.current[idx]?.click()}
                      className={cn(
                        'flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 border p-4 text-center transition-colors',
                        fileName
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-background hover:border-foreground'
                      )}
                    >
                      <span className="text-xs font-bold tracking-[0.1em] uppercase">
                        {zone.title}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {zone.hint}
                      </span>
                      {fileName ? (
                        <>
                          <Check className="text-primary my-1 size-5" />
                          <span className="text-primary max-w-full truncate px-2 text-xs font-bold">
                            {fileName}
                          </span>
                          <span className="text-muted-foreground text-[10px] tracking-wide uppercase">
                            Change file
                          </span>
                        </>
                      ) : (
                        <>
                          <Upload className="text-muted-foreground my-1 size-5" />
                          <span className="text-xs font-bold tracking-wide uppercase">
                            {zone.action}
                          </span>
                        </>
                      )}
                      <input
                        ref={(el) => {
                          fileInputs.current[idx] = el;
                        }}
                        type="file"
                        accept={zone.accept || 'image/*'}
                        className="hidden"
                        onChange={(e) => handleFile(idx, e)}
                      />
                    </button>
                  );
                })}
              </div>
            )}

            {workspace.note && (
              <p className="text-muted-foreground mt-3 text-xs">
                {workspace.note}
              </p>
            )}

            <div className="mt-auto space-y-0 pt-6">
              <hr className="border-border/50" />

              {workspace.settings_label && (
                <>
                  <div className="flex items-center gap-2 py-3.5 text-sm">
                    <Play className="size-3.5 fill-current" />
                    <span className="font-bold">
                      {workspace.settings_label}
                    </span>
                    {workspace.settings_value && (
                      <span className="text-muted-foreground">
                        · {workspace.settings_value}
                      </span>
                    )}
                  </div>
                  <hr className="border-border/50" />
                </>
              )}

              {workspace.cost_label && (
                <>
                  <div className="flex items-baseline justify-between gap-3 pt-3.5">
                    <span className="text-sm font-bold">
                      {workspace.cost_label}
                    </span>
                    <span className="text-primary text-sm font-bold">
                      {workspace.cost_value}
                    </span>
                  </div>
                  {workspace.cost_note && (
                    <p className="text-muted-foreground mt-1 pb-3.5 text-xs">
                      {workspace.cost_url ? (
                        <a
                          href={workspace.cost_url}
                          className="hover:text-foreground underline underline-offset-2"
                        >
                          {workspace.cost_note}
                        </a>
                      ) : (
                        workspace.cost_note
                      )}
                    </p>
                  )}
                  <hr className="border-border/50" />
                </>
              )}

              <button
                type="button"
                disabled={!hasFiles}
                aria-disabled={!hasFiles}
                onClick={() => setModalOpen(true)}
                className={cn(
                  'mt-5 flex h-12 w-full items-center justify-between px-5 text-sm font-bold tracking-wide uppercase transition-colors',
                  hasFiles
                    ? 'bg-foreground text-background hover:bg-primary hover:text-primary-foreground'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                )}
              >
                {workspace.button_title || s.button_title}
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>

          {/* right: example video carousel */}
          <div className="bg-foreground text-background border-border border">
            {tabs.length > 0 && (
              <div className="flex justify-center pt-5">
                <div className="border-background/25 inline-flex border">
                  {tabs.map((t, idx) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTab(idx)}
                      disabled={idx !== 0}
                      className={cn(
                        'px-4 py-2 text-xs font-bold tracking-wide uppercase transition-colors',
                        idx === tab
                          ? 'bg-primary text-primary-foreground'
                          : 'text-background/60 hover:text-background disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-background/60'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-5 md:p-6">
              <div className="border-background/25 relative border">
                <video
                  key={videoIndex}
                  className="aspect-video w-full bg-black object-cover"
                  src={currentVideo.video?.src}
                  poster={currentVideo.video?.poster}
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                  preload="metadata"
                />

                {videos.length > 1 && (
                  <>
                    <span className="absolute top-3 right-3 bg-black/60 px-2 py-1 text-xs font-bold text-white">
                      {videoIndex + 1} / {videos.length}
                    </span>
                    <button
                      type="button"
                      aria-label="Previous example"
                      onClick={() =>
                        setVideoIndex(
                          (videoIndex - 1 + videos.length) % videos.length
                        )
                      }
                      className="border-background/40 text-background hover:bg-primary hover:text-primary-foreground absolute top-1/2 left-3 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border bg-black/40 transition-colors"
                    >
                      <ChevronLeft className="size-5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Next example"
                      onClick={() =>
                        setVideoIndex((videoIndex + 1) % videos.length)
                      }
                      className="border-background/40 text-background hover:bg-primary hover:text-primary-foreground absolute top-1/2 right-3 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border bg-black/40 transition-colors"
                    >
                      <ChevronRight className="size-5" />
                    </button>
                  </>
                )}
              </div>

              {(currentVideo.title || currentVideo.description) && (
                <div className="mt-4 space-y-1">
                  <h3 className="text-sm font-bold tracking-wide uppercase">
                    {currentVideo.title}
                  </h3>
                  <p className="text-background/60 text-sm">
                    {currentVideo.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {s.note && (
          <p className="text-muted-foreground mt-3 text-xs font-bold tracking-[0.14em] uppercase">
            {s.note}
          </p>
        )}
      </div>

      {/* coming soon modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-foreground/70 absolute inset-0"
            onClick={() => setModalOpen(false)}
          />
          <div className="border-border bg-background relative w-full max-w-md border p-6 md:p-8">
            <button
              type="button"
              aria-label="Close"
              onClick={() => setModalOpen(false)}
              className="text-muted-foreground hover:text-foreground absolute top-4 right-4 cursor-pointer"
            >
              <X className="size-5" />
            </button>

            {submitted ? (
              <div className="space-y-3 py-4">
                <p className="text-primary text-xs font-bold tracking-[0.22em] uppercase">
                  Coming Soon
                </p>
                <h3 className="text-2xl leading-none font-display uppercase tracking-tight">
                  You&apos;re on the list!
                </h3>
                <p className="text-muted-foreground text-sm">
                  We&apos;ll send your Rumpelstiltskin-style video to{' '}
                  <span className="text-foreground font-semibold">
                    {email}
                  </span>{' '}
                  the moment production generation goes live.
                </p>
              </div>
            ) : (
              <>
                <p className="text-primary text-xs font-bold tracking-[0.22em] uppercase">
                  Coming Soon
                </p>
                <h3 className="mt-2 text-3xl leading-none font-display uppercase tracking-tight">
                  Leave your email
                </h3>
                <p className="text-muted-foreground mt-3 text-sm">
                  Production generation isn&apos;t live yet. Leave your email —
                  once it launches, your finished video will be sent straight
                  to your inbox.
                </p>
                <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="border-border focus:ring-ring bg-card h-12 w-full border px-4 text-sm outline-none focus:ring-2"
                  />
                  <button
                    type="submit"
                    className="bg-foreground text-background hover:bg-primary hover:text-primary-foreground flex h-12 w-full items-center justify-between px-5 text-sm font-bold tracking-wide uppercase transition-colors"
                  >
                    Notify Me
                    <ArrowRight className="size-4" />
                  </button>
                </form>
                <p className="text-muted-foreground mt-4 text-xs">
                  No spam. One email when your video is ready.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
