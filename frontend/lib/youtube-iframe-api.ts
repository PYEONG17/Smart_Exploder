export type YouTubePlayer = {
  getDuration: () => number;
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  getPlayerState: () => number;
  destroy: () => void;
};

export function isYouTubePlayerReady(
  player: YouTubePlayer | null | undefined,
): player is YouTubePlayer {
  return Boolean(
    player &&
      typeof player.getDuration === "function" &&
      typeof player.getCurrentTime === "function" &&
      typeof player.getPlayerState === "function" &&
      typeof player.seekTo === "function" &&
      typeof player.playVideo === "function" &&
      typeof player.pauseVideo === "function" &&
      typeof player.destroy === "function",
  );
}

export type YouTubePlayerStateEvent = { data: number };
export type YouTubePlayerEvents = {
  onReady?: (player: YouTubePlayer) => void;
  onStateChange?: (event: YouTubePlayerStateEvent) => void;
};

type YouTubeApi = {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (event: { target: YouTubePlayer }) => void;
        onStateChange?: (event: YouTubePlayerStateEvent) => void;
      };
    },
  ) => YouTubePlayer;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
};

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YouTubeApi> | null = null;

export function getYouTubeVideoId(value: string): string | null {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const segments = url.pathname.split("/").filter(Boolean);
    const id = host === "youtu.be"
      ? segments[0]
      : host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com"
        ? url.pathname === "/watch"
          ? url.searchParams.get("v")
          : ["embed", "shorts", "live"].includes(segments[0] ?? "")
            ? segments[1]
            : null
        : null;
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function loadYouTubeIframeApi(): Promise<YouTubeApi> {
  if (typeof window === "undefined") return Promise.reject(new Error("YouTube player is only available in the browser"));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise((resolve, reject) => {
      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousReady?.();
        if (window.YT?.Player) resolve(window.YT);
        else reject(new Error("YouTube player failed to initialize"));
      };
      let script = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');
      if (!script) {
        script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        script.onerror = () => reject(new Error("Could not load YouTube player"));
        document.head.appendChild(script);
      }
    }).catch((error: unknown) => {
      apiPromise = null;
      throw error;
    });
  }
  return apiPromise;
}
