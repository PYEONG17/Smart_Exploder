"use client";

import { useEffect, useRef, useState } from "react";
import { Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getYouTubeVideoId,
  isYouTubePlayerReady,
  loadYouTubeIframeApi,
  type YouTubePlayer,
} from "@/lib/youtube-iframe-api";

type Props = {
  /** Direct video URL (not YouTube). */
  src?: string;
  /** Local file chosen for upload; takes priority over `src`. */
  file?: File | null;
  /** Selected time in seconds, as the string kept by the form. */
  value: string;
  onChange: (value: string) => void;
  onDurationChange?: (seconds: number) => void;
  /** Times (seconds) of other checkpoints, shown as ticks on the timeline. */
  markers?: number[];
  /** Round to whole seconds (drafts for new videos only accept integers). */
  integer?: boolean;
  /** Open the preview immediately when used as the primary video player. */
  openByDefault?: boolean;
};

function formatTime(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, "0")}`;
}

export function VideoTimePicker({
  src,
  file,
  value,
  onChange,
  onDurationChange,
  markers = [],
  integer = false,
  openByDefault = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const youtubeHostRef = useRef<HTMLDivElement>(null);
  const youtubePlayerRef = useRef<YouTubePlayer | null>(null);
  const durationCallbackRef = useRef(onDurationChange);
  durationCallbackRef.current = onDurationChange;
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [youtubeDuration, setYoutubeDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(openByDefault);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    // Object URLs are an external resource that can only be created in an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setObjectUrl(url);
    return () => {
      URL.revokeObjectURL(url);
      setObjectUrl(null);
    };
  }, [file]);

  useEffect(() => {
    setDuration(0);
    setYoutubeDuration(0);
    setCurrent(0);
    setFailed(false);
  }, [src, file]);

  const source = file ? (objectUrl ?? undefined) : src;
  const youtubeId = source ? getYouTubeVideoId(source) : null;
  const timelineDuration = youtubeId ? youtubeDuration : duration;
  const selected = Number(value);
  const selectedValid = Number.isFinite(selected) && selected >= 0;
  const selectionRef = useRef({ selected, selectedValid });
  selectionRef.current = { selected, selectedValid };

  // Keep the preview on the selected frame when the number is typed by hand.
  useEffect(() => {
    const media = videoRef.current;
    if (!media || !selectedValid || media.readyState < 1) return;
    if (Math.abs(media.currentTime - selected) > 0.25) {
      media.currentTime = Math.min(selected, media.duration || selected);
    }
  }, [selected, selectedValid]);

  useEffect(() => {
    if (!open || !youtubeId || !youtubeHostRef.current) return;
    let disposed = false;
    const host = youtubeHostRef.current;
    void loadYouTubeIframeApi().then((api) => {
      if (disposed) return;
      const player = new api.Player(host, {
        videoId: youtubeId,
        playerVars: { controls: 1, enablejsapi: 1, origin: window.location.origin, rel: 0 },
        events: {
          onReady: ({ target }) => {
            if (disposed) return;
            if (!isYouTubePlayerReady(target)) {
              setFailed(true);
              return;
            }
            youtubePlayerRef.current = target;
            const playerDuration = target.getDuration();
            setYoutubeDuration(Number.isFinite(playerDuration) ? playerDuration : 0);
            setFailed(false);
            if (Number.isFinite(playerDuration) && playerDuration > 0) durationCallbackRef.current?.(Math.round(playerDuration));
            if (selectionRef.current.selectedValid) target.seekTo(selectionRef.current.selected, true);
          },
        },
      });
    }).catch(() => setFailed(true));
    const poll = window.setInterval(() => {
      const player = youtubePlayerRef.current;
      if (disposed || !isYouTubePlayerReady(player)) return;
      const nextDuration = player.getDuration();
      const nextCurrent = player.getCurrentTime();
      if (Number.isFinite(nextDuration) && nextDuration > 0) setYoutubeDuration(nextDuration);
      if (Number.isFinite(nextCurrent)) setCurrent(nextCurrent);
    }, 300);
    return () => {
      disposed = true;
      window.clearInterval(poll);
      youtubePlayerRef.current?.destroy();
      youtubePlayerRef.current = null;
    };
  }, [open, youtubeId]);

  useEffect(() => {
    if (
      youtubeId &&
      selectedValid &&
      isYouTubePlayerReady(youtubePlayerRef.current)
    ) {
      youtubePlayerRef.current.seekTo(selected, true);
    }
  }, [youtubeId, selected, selectedValid]);

  const format = (seconds: number) =>
    integer ? String(Math.round(seconds)) : seconds.toFixed(1);

  const handleSlide = (next: number) => {
    const media = videoRef.current;
    if (media) media.currentTime = next;
    if (isYouTubePlayerReady(youtubePlayerRef.current)) {
      youtubePlayerRef.current.seekTo(next, true);
    }
    onChange(format(next));
  };

  if (!open) {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={!source}
        title={source ? undefined : "Ch?n t?p video ho?c d�n link video tr?c ti?p tru?c"}
        onClick={() => setOpen(true)}
      >
        <Crosshair className="mr-1 h-3.5 w-3.5" />
        Ch?n tr�n timeline
      </Button>
    );
  }

  if (!source) {
    return (
      <p className="rounded-md border border-dashed border-border p-2 text-xs text-muted-foreground">
        Chọn tệp video hoặc dán link video trực tiếp để chọn thời điểm trên
        timeline.
      </p>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-border bg-muted/20 p-2">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Thu gọn
        </button>
      </div>
      {youtubeId ? (
        <div ref={youtubeHostRef} className="aspect-video w-full overflow-hidden rounded bg-black" />
      ) : (
        <video
          ref={videoRef}
          key={source}
          src={source}
          controls
          preload="metadata"
          playsInline
          className="max-h-56 w-full rounded bg-black"
          onLoadedMetadata={(event) => {
            setFailed(false);
            const mediaDuration = event.currentTarget.duration;
            setDuration(Number.isFinite(mediaDuration) ? mediaDuration : 0);
            if (Number.isFinite(mediaDuration) && mediaDuration > 0) durationCallbackRef.current?.(Math.round(mediaDuration));
          }}
          onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
          onSeeked={(event) => {
            const seconds = event.currentTarget.currentTime;
            setCurrent(seconds);
            onChange(format(seconds));
          }}
          onError={() => setFailed(true)}
        />
      )}
      {failed ? (
        <p role="alert" className="text-xs text-destructive">
          Không tải được video để xem trước. Bạn vẫn có thể nhập số giây.
        </p>
      ) : (
        <>
          <div className="relative pt-3">
            {timelineDuration > 0 &&
              markers
                .filter((marker) => marker >= 0 && marker <= timelineDuration)
                .map((marker, index) => (
                  <span
                    key={`${marker}-${index}`}
                    title={`Mốc khác: ${formatTime(marker)}`}
                    className="pointer-events-none absolute top-0 h-3 w-0.5 -translate-x-1/2 rounded bg-amber-500"
                    style={{ left: `${(marker / timelineDuration) * 100}%` }}
                  />
                ))}
            <input
              type="range"
              min={0}
              max={timelineDuration || 0}
              step={integer ? 1 : 0.1}
              value={selectedValid ? Math.min(selected, timelineDuration || 0) : 0}
              disabled={timelineDuration === 0}
              onChange={(event) => handleSlide(Number(event.target.value))}
              aria-label="Chọn thời điểm trên timeline"
              className="w-full accent-blue-600"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              Đã chọn:{" "}
              <b className="font-mono text-foreground">
                {selectedValid ? formatTime(selected) : "--:--"}
              </b>
              {timelineDuration > 0 && <> / {formatTime(timelineDuration)}</>}
              <span className="ml-2 text-amber-600">▮ mốc khác</span>
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={timelineDuration === 0}
              onClick={() => onChange(format(current))}
            >
              <Crosshair className="mr-1 h-3.5 w-3.5" />
              Lấy thời điểm đang phát ({formatTime(current)})
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
