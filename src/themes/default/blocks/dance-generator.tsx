'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  Loader2,
  Plus,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Link } from '@/core/i18n/navigation';
import { AIMediaType, AITaskStatus } from '@/extensions/ai/types';
import { useAppContext } from '@/shared/contexts/app';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

const KLING_MODEL =
  'fal-ai/kling-video/o3/standard/video-to-video/reference';
const DEFAULT_TEMPLATE_VIDEO =
  'https://image.airumpelstiltskin.online/ai%20rumpelstiltskin-1.mp4';
const POLL_INTERVAL = 10000;
// 9-second generations with a reference video can take a while; allow 25 min
const GENERATION_TIMEOUT = 1500000;
const SCENE_MAX_LENGTH = 300;
const MAX_PHOTO_MB = 10;

type PhotoSlot = {
  role?: string;
  title?: string;
  hint?: string;
  action?: string;
};

type ExampleVideo = {
  title?: string;
  description?: string;
  video?: { src?: string; poster?: string };
};

type PhotoState = {
  status: 'uploading' | 'uploaded' | 'error';
  url?: string;
  preview?: string;
  name?: string;
};

function parseJson(value: string | null | undefined): any {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function extractVideoUrls(info: any): string[] {
  if (!info) return [];
  if (Array.isArray(info.videos)) {
    return info.videos
      .map((item: any) => {
        if (!item) return null;
        if (typeof item === 'string') return item;
        return item.videoUrl ?? item.url ?? null;
      })
      .filter(Boolean);
  }
  const single = info.video;
  if (single) {
    if (typeof single === 'string') return [single];
    const candidate = single.url ?? single.videoUrl;
    if (candidate) return [candidate];
  }
  return [];
}

export function DanceGenerator({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) {
  const s = section as any;
  const w = s.workspace ?? {};
  const ex = s.examples ?? {};

  const photoSlots: PhotoSlot[] = w.photos ?? [];
  const formatOptions: { value: string; label: string }[] =
    w.format_options ?? [];
  const steps: string[] = ex.steps ?? [];
  const exampleVideos: ExampleVideo[] = ex.videos ?? [];
  const costCredits = Number(w.credits_cost) || 100;
  const templateVideo = w.template_video || DEFAULT_TEMPLATE_VIDEO;
  // fixed output length; the model accepts 3-15 seconds
  const duration = String(w.duration || '9');

  const {
    user,
    isCheckSign,
    setIsShowSignModal,
    fetchUserCredits,
  } = useAppContext();

  const [isMounted, setIsMounted] = useState(false);
  const [photos, setPhotos] = useState<Record<number, PhotoState>>({});
  const [scene, setScene] = useState('');
  const [aspectRatio, setAspectRatio] = useState(
    formatOptions[0]?.value ?? '16:9'
  );

  const [exampleIndex, setExampleIndex] = useState(0);
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(
    null
  );
  const [taskStatus, setTaskStatus] = useState<AITaskStatus | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const fileInputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const remainingCredits = user?.credits?.remainingCredits ?? 0;
  const uploadedPhotoUrls = useMemo(
    () =>
      Object.keys(photos)
        .map(Number)
        .sort((a, b) => a - b)
        .map((idx) => photos[idx])
        .filter((photo) => photo?.status === 'uploaded' && photo.url)
        .map((photo) => photo.url as string),
    [photos]
  );
  const hasMainPhoto = photos[0]?.status === 'uploaded';
  const isUploading = Object.values(photos).some(
    (photo) => photo?.status === 'uploading'
  );
  const currentExample = exampleVideos[exampleIndex] ?? {};

  const handlePhotoFile = async (idx: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(w.upload_failed || 'Upload failed, please try again');
      return;
    }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      toast.error(w.file_too_large || `Photo must be ${MAX_PHOTO_MB} MB or smaller`);
      return;
    }

    const preview = URL.createObjectURL(file);
    setPhotos((prev) => ({
      ...prev,
      [idx]: { status: 'uploading', preview, name: file.name },
    }));

    try {
      const formData = new FormData();
      formData.append('files', file);
      const resp = await fetch('/api/storage/upload-image', {
        method: 'POST',
        body: formData,
      });
      const json = await resp.json();
      if (!resp.ok || json.code !== 0 || !json.data?.urls?.length) {
        throw new Error(json?.message || 'upload failed');
      }
      setPhotos((prev) => ({
        ...prev,
        [idx]: {
          status: 'uploaded',
          url: json.data.urls[0],
          preview,
          name: file.name,
        },
      }));
    } catch (e: any) {
      console.error('upload photo failed', e);
      setPhotos((prev) => ({
        ...prev,
        [idx]: { status: 'error', preview, name: file.name },
      }));
      toast.error(w.upload_failed || 'Upload failed, please try again');
    }
  };

  const clearPhoto = (idx: number) => {
    setPhotos((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  };

  const resetTaskState = useCallback(() => {
    setIsGenerating(false);
    setProgress(0);
    setTaskId(null);
    setGenerationStartTime(null);
    setTaskStatus(null);
  }, []);

  const pollTaskStatus = useCallback(
    async (id: string) => {
      try {
        if (
          generationStartTime &&
          Date.now() - generationStartTime > GENERATION_TIMEOUT
        ) {
          resetTaskState();
          toast.error('Video generation timed out. Please try again.');
          return true;
        }

        const resp = await fetch('/api/ai/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId: id }),
        });
        const { code, message, data } = await resp.json();
        if (!resp.ok || code !== 0) {
          throw new Error(message || 'Query task failed');
        }

        const task = data;
        const status = task.status as AITaskStatus;
        setTaskStatus(status);

        const info = parseJson(task.taskInfo);
        const videoUrls = extractVideoUrls(info);

        if (status === AITaskStatus.PENDING) {
          setProgress((prev) => Math.max(prev, 20));
          return false;
        }

        if (status === AITaskStatus.PROCESSING) {
          setProgress((prev) => Math.min(prev + 8, 85));
          return false;
        }

        if (status === AITaskStatus.SUCCESS) {
          if (videoUrls.length === 0) {
            toast.error('The provider returned no videos. Please retry.');
          } else {
            setResultVideoUrl(videoUrls[0]);
            setProgress(100);
            toast.success('Your video is ready');
          }
          resetTaskState();
          await fetchUserCredits();
          return true;
        }

        if (status === AITaskStatus.FAILED) {
          toast.error(info?.errorMessage || 'Generation failed');
          resetTaskState();
          await fetchUserCredits();
          return true;
        }

        return false;
      } catch (error: any) {
        console.error('Error polling video task:', error);
        toast.error(`Query task failed: ${error.message}`);
        resetTaskState();
        return true;
      }
    },
    [generationStartTime, resetTaskState, fetchUserCredits]
  );

  useEffect(() => {
    if (!taskId || !isGenerating) {
      return;
    }

    let cancelled = false;

    const tick = async () => {
      if (!taskId || cancelled) return;
      const completed = await pollTaskStatus(taskId);
      if (completed) cancelled = true;
    };

    tick();

    const interval = setInterval(async () => {
      if (cancelled || !taskId) {
        clearInterval(interval);
        return;
      }
      const completed = await pollTaskStatus(taskId);
      if (completed) clearInterval(interval);
    }, POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [taskId, isGenerating, pollTaskStatus]);

  const handleGenerate = async () => {
    if (!user) {
      setIsShowSignModal(true);
      return;
    }

    if (!hasMainPhoto) {
      toast.error(w.need_photo || 'Add at least the main character photo');
      return;
    }

    if (remainingCredits < costCredits) {
      toast.error(
        w.insufficient || 'Insufficient credits. Please top up to keep creating.'
      );
      return;
    }

    const sceneText = scene.trim();
    const replacement =
      uploadedPhotoUrls.length > 1
        ? 'the two dancing characters with @Element1 and @Element2'
        : 'the dancing character with @Element1';
    const prompt = [
      `Replace ${replacement}, keeping the same dance moves, camera work and timing.`,
      sceneText,
    ]
      .filter(Boolean)
      .join(' ');

    setIsGenerating(true);
    setProgress(15);
    setTaskStatus(AITaskStatus.PENDING);
    setResultVideoUrl(null);
    setGenerationStartTime(Date.now());

    try {
      const resp = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaType: AIMediaType.VIDEO,
          scene: 'video-to-video',
          provider: 'fal',
          model: KLING_MODEL,
          prompt,
          options: {
            image_input: uploadedPhotoUrls,
            video_input: [templateVideo],
            aspect_ratio: aspectRatio,
            duration,
            keep_audio: true,
          },
        }),
      });

      const { code, message, data } = await resp.json();
      if (!resp.ok || code !== 0) {
        throw new Error(message || 'Failed to create a video task');
      }

      const newTaskId = data?.id;
      if (!newTaskId) {
        throw new Error('Task id missing in response');
      }

      setTaskId(newTaskId);
      setProgress(25);
      await fetchUserCredits();
    } catch (error: any) {
      console.error('Failed to generate video:', error);
      toast.error(`Failed to generate video: ${error.message}`);
      resetTaskState();
    }
  };

  const handleDownload = async () => {
    if (!resultVideoUrl) return;
    try {
      setIsDownloading(true);
      const resp = await fetch(
        `/api/proxy/file?url=${encodeURIComponent(resultVideoUrl)}`
      );
      if (!resp.ok) throw new Error('Failed to fetch video');
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'rumpelstiltskin-dance.mp4';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 200);
      toast.success('Video downloaded');
    } catch (error) {
      console.error('Failed to download video:', error);
      toast.error('Failed to download video');
    } finally {
      setIsDownloading(false);
    }
  };

  const taskStatusLabel = useMemo(() => {
    switch (taskStatus) {
      case AITaskStatus.PENDING:
        return w.status_pending || 'Waiting for the model to start...';
      case AITaskStatus.PROCESSING:
        return w.generating || 'Generating your video...';
      default:
        return w.generating || 'Generating your video...';
    }
  }, [taskStatus, w.generating, w.status_pending]);

  const renderCta = () => {
    if (!isMounted) {
      return (
        <button
          type="button"
          disabled
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#3a2f1b] text-sm font-bold tracking-wide text-[#a89e8c] uppercase"
        >
          <Loader2 className="size-4 animate-spin" />
          {w.loading || 'Loading...'}
        </button>
      );
    }

    if (!user) {
      return (
        <button
          type="button"
          onClick={() => setIsShowSignModal(true)}
          disabled={isCheckSign}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#f0b429] text-sm font-bold tracking-wide text-[#1c150a] uppercase transition-colors hover:bg-[#ffc94d] disabled:opacity-60"
        >
          {isCheckSign ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <User className="size-4" />
          )}
          {w.sign_in || 'Sign in to generate'}
          <ArrowRight className="size-4" />
        </button>
      );
    }

    if (remainingCredits < costCredits) {
      return (
        <Link href="/pricing" className="block">
          <button
            type="button"
            className="flex h-12 w-full items-center justify-between rounded-full bg-[#f0b429] px-5 text-sm font-bold tracking-wide text-[#1c150a] uppercase transition-colors hover:bg-[#ffc94d]"
          >
            <span className="flex items-center gap-2">
              <CreditCard className="size-4" />
              {w.buy || 'Get credits'}
            </span>
            <ArrowRight className="size-4" />
          </button>
        </Link>
      );
    }

    return (
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isGenerating || !hasMainPhoto || isUploading}
        className={cn(
          'flex h-12 w-full items-center justify-between rounded-full px-5 text-sm font-bold tracking-wide uppercase transition-colors',
          isGenerating || !hasMainPhoto || isUploading
            ? 'cursor-not-allowed bg-[#3a2f1b] text-[#a89e8c]'
            : 'bg-[#f0b429] text-[#1c150a] hover:bg-[#ffc94d]'
        )}
      >
        <span className="flex items-center gap-2">
          {isGenerating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {isGenerating
            ? w.generating || 'Generating...'
            : w.generate || `Generate video · ${costCredits} credits`}
        </span>
        <ArrowRight className="size-4" />
      </button>
    );
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
            <p className="font-mono text-xs font-bold tracking-[0.22em] text-[#f0b429] uppercase">
              {section.label}
            </p>
          )}
          <h1 className="font-display mt-3 break-words text-4xl leading-[0.95] tracking-tight text-[#f2ead9] uppercase text-balance sm:text-5xl md:text-6xl">
            {section.title}
          </h1>
          {section.description && (
            <p className="mt-4 max-w-2xl text-base font-medium text-[#a89e8c] text-balance">
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
          {/* left: generator form */}
          <div className="flex flex-col rounded-2xl border border-[#3a2f1b] bg-[#211910] p-6 md:p-7">
            <h3 className="font-display text-2xl tracking-tight text-[#f2ead9] uppercase md:text-3xl">
              {w.title}
            </h3>
            {w.subtitle && (
              <p className="mt-2 text-sm text-[#a89e8c]">{w.subtitle}</p>
            )}

            {/* 1. photos */}
            <div className="mt-7">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-bold text-[#f2ead9]">
                  {w.photos_label}
                </span>
                <span className="font-mono text-[11px] text-[#a89e8c]">
                  {w.photos_hint}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                {photoSlots.map((slot, idx) => {
                  const photo = photos[idx];
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => fileInputs.current[idx]?.click()}
                      className={cn(
                        'relative flex min-h-[7.5rem] cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border border-dashed p-4 text-center transition-colors',
                        photo?.status === 'uploaded'
                          ? 'border-[#f0b429]/70 bg-[#f0b429]/5'
                          : 'border-[#8a744a]/60 hover:border-[#f0b429]/70'
                      )}
                    >
                      {photo?.preview && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photo.preview}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover opacity-30"
                        />
                      )}

                      {photo?.status === 'uploading' ? (
                        <span className="relative flex flex-col items-center gap-1.5">
                          <Loader2 className="size-5 animate-spin text-[#f0b429]" />
                          <span className="max-w-full truncate px-2 font-mono text-[10px] text-[#a89e8c]">
                            {photo.name}
                          </span>
                        </span>
                      ) : photo?.status === 'uploaded' ? (
                        <span className="relative flex flex-col items-center gap-1">
                          <Check className="size-5 text-[#f0b429]" />
                          <span className="max-w-full truncate px-2 text-xs font-bold text-[#f2ead9]">
                            {slot.title}
                          </span>
                          <span className="font-mono text-[10px] tracking-wide text-[#a89e8c] uppercase">
                            {w.change_photo || 'Change'}
                          </span>
                        </span>
                      ) : (
                        <span className="relative flex flex-col items-center gap-1.5">
                          <span className="flex size-9 items-center justify-center rounded-full border border-[#f0b429]/60 bg-[#f0b429]/10">
                            <Plus className="size-4 text-[#f0b429]" />
                          </span>
                          <span className="text-xs font-bold text-[#f2ead9]">
                            {slot.title}
                          </span>
                          <span className="text-[11px] text-[#a89e8c]">
                            {slot.hint}
                          </span>
                        </span>
                      )}

                      <input
                        ref={(el) => {
                          fileInputs.current[idx] = el;
                        }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoFile(idx, file);
                          e.target.value = '';
                        }}
                      />
                    </button>
                  );
                })}
              </div>

              {/* remove buttons live outside the upload buttons */}
              <div className="mt-2 flex gap-3">
                {photoSlots.map((slot, idx) =>
                  photos[idx]?.status === 'uploaded' ||
                  photos[idx]?.status === 'error' ? (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => clearPhoto(idx)}
                      className="flex flex-1 items-center justify-center gap-1 text-[11px] text-[#6b6252] transition-colors hover:text-[#a89e8c]"
                    >
                      <X className="size-3" />
                      {slot.title}
                    </button>
                  ) : (
                    <span key={idx} className="flex-1" />
                  )
                )}
              </div>

              {w.photos_note && (
                <p className="mt-2 text-xs text-[#6b6252]">{w.photos_note}</p>
              )}
            </div>

            {/* 2. scene */}
            <div className="mt-7">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-bold text-[#f2ead9]">
                  {w.scene_label}{' '}
                  <span className="font-normal text-[#a89e8c]">
                    {w.scene_optional}
                  </span>
                </span>
                <span className="font-mono text-[11px] text-[#a89e8c]">
                  {scene.trim().length}/{SCENE_MAX_LENGTH}
                </span>
              </div>
              <textarea
                value={scene}
                maxLength={SCENE_MAX_LENGTH}
                onChange={(e) => setScene(e.target.value)}
                placeholder={w.scene_placeholder}
                className="mt-3 min-h-24 w-full resize-none rounded-xl border border-[#3a2f1b]! bg-[#1a1409]! p-4 text-sm text-[#f2ead9] outline-none placeholder:text-[#6b6252] focus:border-[#f0b429]/60!"
              />
            </div>

            {/* 3: format */}
            <div className="mt-7">
              <span className="text-sm font-bold text-[#f2ead9]">
                {w.format_label}
              </span>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="mt-3 h-12 w-full rounded-xl border border-[#3a2f1b]! bg-[#1a1409]! px-3 text-sm text-[#f2ead9] outline-none focus:border-[#f0b429]/60!"
              >
                {formatOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* cta + credits */}
            <div className="mt-auto space-y-3 pt-8">
              {isGenerating && (
                <div className="space-y-2 rounded-xl border border-[#3a2f1b] p-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#f2ead9]">
                      {w.progress || 'Progress'}
                    </span>
                    <span className="font-mono text-[#f0b429]">
                      {progress}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#3a2f1b]">
                    <div
                      className="h-full rounded-full bg-[#f0b429] transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-center font-mono text-[11px] text-[#a89e8c]">
                    {taskStatusLabel}
                  </p>
                  {w.generating_estimate && (
                    <p className="pt-1 text-center text-xs font-bold text-[#f0b429]">
                      {w.generating_estimate}
                    </p>
                  )}
                  {w.generating_hint && (
                    <p className="text-center font-mono text-[10px] leading-relaxed text-[#6b6252]">
                      {w.generating_hint}
                    </p>
                  )}
                </div>
              )}

              {renderCta()}

              {isMounted && user && (
                <div className="flex items-center justify-between font-mono text-[11px] text-[#a89e8c]">
                  <span>
                    {w.cost_label || 'Cost'}: {costCredits}{' '}
                    {w.credits_label || 'credits'}
                  </span>
                  <span>
                    {w.remaining_label || 'Remaining'}: {remainingCredits}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* right: video panel */}
          <div className="flex flex-col rounded-2xl border border-[#3a2f1b] bg-[#211910] p-6 md:p-7">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-2xl tracking-tight text-[#f2ead9] uppercase md:text-3xl">
                {ex.title}
              </h3>
              <span className="font-mono text-[11px] tracking-[0.14em] text-[#a89e8c] uppercase">
                {resultVideoUrl
                  ? ex.your_video_badge || 'Your video'
                  : ex.badge || 'Example video'}
              </span>
            </div>

            <div className="mt-5">
              {resultVideoUrl ? (
                <div className="relative">
                  <video
                    src={resultVideoUrl}
                    controls
                    playsInline
                    className="max-h-[75vh] w-full rounded-xl border border-[#8a744a]/40 bg-black object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="absolute right-3 bottom-3 flex size-10 items-center justify-center rounded-full border border-[#8a744a]/50 bg-black/60 text-[#f2ead9] transition-colors hover:border-[#f0b429] hover:text-[#f0b429]"
                    aria-label="Download video"
                  >
                    {isDownloading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Download className="size-4" />
                    )}
                  </button>
                </div>
              ) : isGenerating ? (
                <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border border-[#3a2f1b] bg-[#1a1409]">
                  <Loader2 className="size-7 animate-spin text-[#f0b429]" />
                  <p className="font-mono text-xs text-[#a89e8c]">
                    {taskStatusLabel}
                  </p>
                  {w.generating_estimate && (
                    <p className="text-sm font-bold text-[#f0b429]">
                      {w.generating_estimate}
                    </p>
                  )}
                  {w.generating_hint && (
                    <p className="max-w-xs text-center font-mono text-[11px] leading-relaxed text-[#6b6252]">
                      {w.generating_hint}
                    </p>
                  )}
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-xl border border-[#3a2f1b]">
                  <video
                    key={exampleIndex}
                    src={currentExample.video?.src}
                    poster={currentExample.video?.poster}
                    className="aspect-video w-full bg-black object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls
                    preload="metadata"
                  />

                  {exampleVideos.length > 1 && (
                    <>
                      <span className="absolute top-3 right-3 rounded-full bg-black/60 px-2.5 py-1 font-mono text-[10px] text-white">
                        {exampleIndex + 1} / {exampleVideos.length}
                      </span>
                      <button
                        type="button"
                        aria-label="Previous example"
                        onClick={() =>
                          setExampleIndex(
                            (exampleIndex - 1 + exampleVideos.length) %
                              exampleVideos.length
                          )
                        }
                        className="absolute top-1/2 left-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#8a744a]/50 bg-black/50 text-[#f2ead9] transition-colors hover:border-[#f0b429] hover:text-[#f0b429]"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Next example"
                        onClick={() =>
                          setExampleIndex(
                            (exampleIndex + 1) % exampleVideos.length
                          )
                        }
                        className="absolute top-1/2 right-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#8a744a]/50 bg-black/50 text-[#f2ead9] transition-colors hover:border-[#f0b429] hover:text-[#f0b429]"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {(currentExample.title || currentExample.description) &&
              !resultVideoUrl &&
              !isGenerating && (
                <div className="mt-4">
                  <h4 className="text-sm font-bold tracking-wide text-[#f2ead9] uppercase">
                    {currentExample.title}
                  </h4>
                  <p className="mt-1 text-sm text-[#a89e8c]">
                    {currentExample.description}
                  </p>
                </div>
              )}

            {steps.length > 0 && (
              <ol className="mt-6 space-y-3 border-t border-[#3a2f1b] pt-6">
                {steps.map((step, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-sm text-[#d8cdb8]"
                  >
                    <span className="font-mono text-xs text-[#f0b429]">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            )}

            {w.footnote && (
              <p className="mt-5 font-mono text-[11px] text-[#6b6252]">
                {w.footnote}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
