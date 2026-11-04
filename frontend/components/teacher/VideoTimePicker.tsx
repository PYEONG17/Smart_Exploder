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
  /** Đường dẫn video trực tiếp, không phải liên kết YouTube. */
  src?: string;
  /** Tệp cục bộ được chọn để tải lên; có ưu tiên hơn `src`. */
  file?: File | null;
  /** Thời gian đã chọn tính bằng giây, theo dạng chuỗi lưu trong form. */
  value: string;
  onChange: (value: string) => void;
  onDurationChange?: (seconds: number) => void;
  /** Thời gian (giây) của các chốt khác, hiển thị dưới dạng đánh dấu trên đường thời gian. */
  markers?: number[];
  /** Làm tròn về giây nguyên; bản nháp video mới chỉ nhận giá trị nguyên. */
  integer?: boolean;
  /** Mở sẵn phần xem trước khi dùng làm trình phát video chính. */
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
  const selectionRef = useRef({ selected: Number(value), selectedValid: false });
  const [objectUrl, setObjectUrl] = useState<{ file: File; url: string } | null>(null);
  const [durationState, setDurationState] = useState({ source: "", value: 0 });
  const [youtubeDurationState, setYoutubeDurationState] = useState({ source: "", value: 0 });
  const [currentState, setCurrentState] = useState({ source: "", value: 0 });
  const [failedState, setFailedState] = useState({ source: "", value: false });
  const [open, setOpen] = useState(openByDefault);

  useEffect(() => {
    durationCallbackRef.current = onDurationChange;
  }, [onDurationChange]);

  const selected = Number(value);
  const selectedValid = Number.isFinite(selected) && selected >= 0;
  useEffect(() => {
    selectionRef.current = { selected, selectedValid };
  }, [selected, selectedValid]);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    // URL tạm cho tệp là tài nguyên bên ngoài, cần tạo trong effect và thu hồi khi không còn dùng.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Lưu URL vừa tạo để phần xem trước phát được tệp.
    setObjectUrl({ file, url });
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const source = file
    ? objectUrl?.file === file
      ? objectUrl.url
      : undefined
    : src;
  const youtubeId = source ? getYouTubeVideoId(source) : null;
  const sourceKey = source ?? "";
  const duration = durationState.source === sourceKey ? durationState.value : 0;
  const youtubeDuration =
    youtubeDurationState.source === sourceKey ? youtubeDurationState.value : 0;
  const current = currentState.source === sourceKey ? currentState.value : 0;
  const failed =
    failedState.source === sourceKey ? failedState.value : false;
  const timelineDuration = youtubeId ? youtubeDuration : duration;

  // Đồng bộ khung xem trước đến thời điểm đã chọn khi người dùng tự nhập số giây.
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
    void loadYouTubeIframeApi()
      .then((api) => {
        if (disposed) return;
        new api.Player(host, {
          videoId: youtubeId,
          playerVars: {
            controls: 1,
            enablejsapi: 1,
            origin: window.location.origin,
            rel: 0,
          },
          events: {
            onReady: ({ target }) => {
              if (disposed) return;
              if (!isYouTubePlayerReady(target)) {
                setFailedState({ source: sourceKey, value: true });
                return;
              }
              youtubePlayerRef.current = target;
              const playerDuration = target.getDuration();
              setYoutubeDurationState({
                source: sourceKey,
                value: Number.isFinite(playerDuration) ? playerDuration : 0,
              });
              setFailedState({ source: sourceKey, value: false });
              if (Number.isFinite(playerDuration) && playerDuration > 0)
                durationCallbackRef.current?.(Math.round(playerDuration));
              if (selectionRef.current.selectedValid)
                target.seekTo(selectionRef.current.selected, true);
            },
          },
        });
      })
      .catch(() => setFailedState({ source: sourceKey, value: true }));
    const poll = window.setInterval(() => {
      const player = youtubePlayerRef.current;
      if (disposed || !isYouTubePlayerReady(player)) return;
      const nextDuration = player.getDuration();
      const nextCurrent = player.getCurrentTime();
      if (Number.isFinite(nextDuration) && nextDuration > 0)
        setYoutubeDurationState({ source: sourceKey, value: nextDuration });
      if (Number.isFinite(nextCurrent))
        setCurrentState({ source: sourceKey, value: nextCurrent });
    }, 300);
    return () => {
      disposed = true;
      window.clearInterval(poll);
      youtubePlayerRef.current?.destroy();
      youtubePlayerRef.current = null;
    };
  }, [open, youtubeId, sourceKey]);

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
        title={
          source
            ? undefined
            : "Chọn tệp video hoặc dán link video trực tiếp để chọn thời điểm trên timeline"
        }
        onClick={() => setOpen(true)}
      >
        <Crosshair className="mr-1 h-3.5 w-3.5" />
        Chọn trên timeline
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
        <div
          ref={youtubeHostRef}
          className="aspect-video w-full overflow-hidden rounded bg-black"
        />
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
            setFailedState({ source: sourceKey, value: false });
            const mediaDuration = event.currentTarget.duration;
            setDurationState({
              source: sourceKey,
              value: Number.isFinite(mediaDuration) ? mediaDuration : 0,
            });
            if (Number.isFinite(mediaDuration) && mediaDuration > 0)
              durationCallbackRef.current?.(Math.round(mediaDuration));
          }}
          onTimeUpdate={(event) =>
            setCurrentState({
              source: sourceKey,
              value: event.currentTarget.currentTime,
            })
          }
          onSeeked={(event) => {
            const seconds = event.currentTarget.currentTime;
            setCurrentState({ source: sourceKey, value: seconds });
            onChange(format(seconds));
          }}
          onError={() => setFailedState({ source: sourceKey, value: true })}
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
              value={
                selectedValid ? Math.min(selected, timelineDuration || 0) : 0
              }
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
