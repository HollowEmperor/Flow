import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Monitor,
  Cpu,
  Play,
  Pause,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  Power,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Video,
  GraduationCap,
  Upload,
  SkipForward,
  RotateCcw,
} from 'lucide-react';
import {
  TopicItem,
  TopicResource,
  TopicResourceType,
} from '../utils/todoLogic';

interface TopicPcMonitorStationProps {
  topic: TopicItem;
  topics?: TopicItem[];
  activeVideoResourceId?: string | null;
  onSelectVideoResourceId?: (resourceId: string | null) => void;
  onSelectTopic?: (topicId: string) => void;
  onAddResource: (
    topicId: string,
    resource: {
      title: string;
      type: TopicResourceType;
      url: string;
      fileName?: string;
      fileSizeLabel?: string;
    }
  ) => void;
  onToggleResource: (topicId: string, resourceId: string) => void;
  onDeleteResource: (topicId: string, resourceId: string) => void;
}

export function isVideoTopicResource(res: TopicResource): boolean {
  if (res.type === 'YouTube' || res.type === 'Udemy') return true;
  const lowerUrl = res.url.toLowerCase();
  return (
    lowerUrl.includes('youtube.com') ||
    lowerUrl.includes('youtu.be') ||
    lowerUrl.includes('vimeo.com') ||
    lowerUrl.includes('udemy.com') ||
    lowerUrl.includes('loom.com') ||
    lowerUrl.endsWith('.mp4') ||
    lowerUrl.endsWith('.webm') ||
    lowerUrl.endsWith('.mov')
  );
}

/**
 * Extracts a real 11-character YouTube video ID if present in the URL.
 */
export function extractYouTubeVideoId(url: string): string | null {
  try {
    const trimmed = url.trim();
    const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return shortMatch[1];

    const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return watchMatch[1];

    const embedMatch = trimmed.match(
      /youtube\.com\/(?:embed|shorts|live)\/([a-zA-Z0-9_-]{11})/
    );
    if (embedMatch) return embedMatch[1];
  } catch {
    // Ignore parse errors
  }
  return null;
}

export const TopicPcMonitorStation: React.FC<TopicPcMonitorStationProps> = ({
  topic,
  topics,
  activeVideoResourceId,
  onSelectVideoResourceId,
  onSelectTopic,
  onAddResource,
  onToggleResource,
  onDeleteResource,
}) => {
  const videoResources = useMemo(
    () => topic.resources.filter(isVideoTopicResource),
    [topic.resources]
  );

  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    () => videoResources[0]?.id ?? topic.resources[0]?.id ?? null
  );

  const selectedId =
    activeVideoResourceId !== undefined && activeVideoResourceId !== null
      ? activeVideoResourceId
      : internalSelectedId;

  const setSelectedId = (id: string | null) => {
    setInternalSelectedId(id);
    onSelectVideoResourceId?.(id);
  };

  // Keep selected video synced when topic changes or new video is added
  const prevCountRef = useRef<number>(videoResources.length);
  const prevTopicIdRef = useRef<string>(topic.id);

  useEffect(() => {
    if (topic.id !== prevTopicIdRef.current) {
      prevTopicIdRef.current = topic.id;
      prevCountRef.current = videoResources.length;
      setInternalSelectedId(
        videoResources[0]?.id ?? topic.resources[0]?.id ?? null
      );
      return;
    }

    if (videoResources.length > prevCountRef.current) {
      const newest = videoResources[videoResources.length - 1];
      if (newest) {
        setSelectedId(newest.id);
      }
      prevCountRef.current = videoResources.length;
      return;
    }

    prevCountRef.current = videoResources.length;
  }, [topic.id, videoResources, topic.resources]);

  const activeResource: TopicResource | null = useMemo(() => {
    return (
      topic.resources.find((r) => r.id === selectedId) ??
      videoResources[0] ??
      topic.resources[0] ??
      null
    );
  }, [topic.resources, videoResources, selectedId]);

  // PC & Monitor Hardware State
  const [isPcPoweredOn, setIsPcPoweredOn] = useState(true);
  const [isWidescreenExpanded, setIsWidescreenExpanded] = useState(false);
  const [playerMode, setPlayerMode] = useState<'auto' | 'studio'>('auto');

  // Interactive Studio Monitor Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.25 | 1.5 | 2>(1);
  const [progressSec, setProgressSec] = useState(142);
  const totalDurationSec = 1480; // 24:40 lecture

  // Quick Add Video Link Form State
  const [videoType, setVideoType] = useState<'YouTube' | 'Udemy'>('YouTube');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const videoFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isPlaying || !isPcPoweredOn) return;
    const interval = window.setInterval(() => {
      setProgressSec((prev) =>
        prev + 1 >= totalDurationSec ? 0 : prev + 1
      );
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isPlaying, isPcPoweredOn]);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const youtubeVideoId = activeResource
    ? extractYouTubeVideoId(activeResource.url)
    : null;

  const isDirectVideoFile =
    activeResource &&
    (activeResource.url.startsWith('blob:') ||
      activeResource.url.toLowerCase().endsWith('.mp4') ||
      activeResource.url.toLowerCase().endsWith('.webm'));

  const handleAddVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = videoTitle.trim();
    const cleanUrl = videoUrl.trim();
    if (!cleanTitle && !cleanUrl) return;

    const finalTitle =
      cleanTitle ||
      `Video Lecture (${videoType} · ${cleanUrl.slice(0, 28)})`;
    const finalUrl =
      cleanUrl ||
      (videoType === 'YouTube'
        ? 'https://www.youtube.com/watch?v=M7lc1UVf-VE'
        : 'https://www.udemy.com/course/topic-mastery');

    onAddResource(topic.id, {
      title: finalTitle,
      type: videoType,
      url: finalUrl,
    });

    setVideoTitle('');
    setVideoUrl('');
    setIsPcPoweredOn(true);
  };

  const handleUploadLocalVideoFile = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const cleanName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
      let blobUrl = `https://video.focusflow.local/${encodeURIComponent(file.name)}`;
      try {
        if (typeof URL !== 'undefined' && URL.createObjectURL) {
          blobUrl = URL.createObjectURL(file);
        }
      } catch {
        // Fallback
      }

      onAddResource(topic.id, {
        title: cleanName || file.name,
        type: 'YouTube',
        url: blobUrl,
        fileName: file.name,
        fileSizeLabel: `${Math.max(1, Math.round(file.size / 1024))} KB Video`,
      });
    });
    if (videoFileInputRef.current) {
      videoFileInputRef.current.value = '';
    }
    setIsPcPoweredOn(true);
  };

  const handleNextVideo = () => {
    const list = videoResources.length > 0 ? videoResources : topic.resources;
    if (list.length === 0) return;
    const idx = list.findIndex((r) => r.id === activeResource?.id);
    const next = list[(idx + 1) % list.length];
    if (next) {
      setSelectedId(next.id);
    }
  };

  return (
    <section
      aria-label="PC & Monitor Video Workstation"
      data-testid="topic-pc-monitor-station"
      className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4 shadow-2xs"
    >
      {/* Top Workstation Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Monitor
              className="w-5 h-5 text-blue-600 shrink-0"
              aria-hidden="true"
            />
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 font-display">
              Topic PC &amp; Monitor — Video Lecture Workstation
            </h2>
            <span
              data-testid="pc-video-count"
              className="text-xs font-mono tabular-nums font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-0.5"
            >
              {videoResources.length}{' '}
              {videoResources.length === 1 ? 'Video Link' : 'Video Links'}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Just like books stand in your Library shelf above, video links (YouTube, Udemy &amp; video files) boot directly inside your desktop **PC &amp; Monitor screen** below.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <input
            ref={videoFileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={(e) => handleUploadLocalVideoFile(e.target.files)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => videoFileInputRef.current?.click()}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Load Video File to PC</span>
          </button>

          <button
            type="button"
            data-testid="pc-power-toggle-btn"
            onClick={() => setIsPcPoweredOn((prev) => !prev)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-colors cursor-pointer ${
              isPcPoweredOn
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-slate-900 text-slate-300 border-slate-700'
            }`}
          >
            <Power className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isPcPoweredOn ? 'PC ON' : 'PC STANDBY'}</span>
          </button>
        </div>
      </div>

      {/* Optional Topic Selector Strip when shown on Overview */}
      {topics && topics.length > 1 && onSelectTopic && (
        <div
          role="group"
          aria-label="Select topic for PC monitor"
          className="flex flex-wrap items-center gap-1.5 pt-1"
        >
          <span className="text-[11px] font-semibold text-slate-500 mr-1">
            PC Topic Channel:
          </span>
          {topics.map((t) => {
            const isActive = t.id === topic.id;
            const vCount = t.resources.filter(isVideoTopicResource).length;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectTopic(t.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-purple-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t.title} ({vCount} videos)
              </button>
            );
          })}
        </div>
      )}

      {/* Main Desk Stage: Widescreen Monitor + Desktop PC Tower Rig */}
      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 sm:p-5">
        <div className="grid grid-cols-1 @xl:grid-cols-12 gap-5 items-end">
          {/* LEFT / CENTER (8 cols or 12 cols in Theater Mode): THE WIDESCREEN MONITOR */}
          <div
            className={
              isWidescreenExpanded ? '@xl:col-span-12' : '@xl:col-span-8'
            }
          >
            {/* Outer Monitor Bezel */}
            <div
              data-testid="pc-monitor-screen-frame"
              className="bg-slate-900 border-[4px] border-slate-800 rounded-2xl overflow-hidden shadow-md"
            >
              {/* Top Monitor Bezel with Webcam Sensor & OS Titlebar */}
              <div className="bg-slate-950 px-3.5 py-2 border-b border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0" />
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="ml-1 text-[11px] font-mono text-slate-300 truncate">
                    {isPcPoweredOn
                      ? activeResource
                        ? `FocusOS Media Player — ${activeResource.title}`
                        : 'FocusOS — No Video Selected'
                      : 'DISPLAY STANDBY'}
                  </span>
                </div>

                {/* Webcam lens dot in center-right + Screen Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  {isPcPoweredOn && activeResource && (
                    <button
                      type="button"
                      onClick={() =>
                        setPlayerMode((prev) =>
                          prev === 'auto' ? 'studio' : 'auto'
                        )
                      }
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-emerald-400 cursor-pointer"
                    >
                      {playerMode === 'auto' && youtubeVideoId
                        ? 'Switch to Studio Deck'
                        : 'Embed Mode'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsWidescreenExpanded((prev) => !prev)}
                    aria-label="Toggle monitor theater width"
                    title="Toggle Theater Width"
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  >
                    {isWidescreenExpanded ? (
                      <Minimize2 className="w-3 h-3" aria-hidden="true" />
                    ) : (
                      <Maximize2 className="w-3 h-3" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* Monitor Active Display Viewport */}
              <div
                data-testid="pc-monitor-viewport"
                className="relative aspect-video w-full bg-slate-950 flex flex-col justify-between overflow-hidden"
              >
                {!isPcPoweredOn ? (
                  /* Powered-Off Monitor Screen */
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 select-none">
                    <Power
                      className="w-8 h-8 text-slate-700 mb-2"
                      aria-hidden="true"
                    />
                    <p className="text-xs font-mono uppercase tracking-widest text-slate-600">
                      No Signal · PC Tower in Standby
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsPcPoweredOn(true)}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                    >
                      Press PC Power Button to Boot
                    </button>
                  </div>
                ) : !activeResource ? (
                  /* Powered-On Monitor with No Video Resource Yet */
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                    <Video
                      className="w-8 h-8 text-blue-400 mb-2"
                      aria-hidden="true"
                    />
                    <p className="text-sm font-bold text-white">
                      PC Monitor Ready for Video Input
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Add a YouTube lecture, Udemy course link, or video file below to play it directly inside this monitor.
                    </p>
                  </div>
                ) : isDirectVideoFile ? (
                  /* Native HTML5 Video Player for Uploaded / Direct .MP4/.WebM Files */
                  <video
                    key={activeResource.id}
                    src={activeResource.url}
                    controls
                    className="w-full h-full object-contain bg-black"
                  />
                ) : youtubeVideoId && playerMode === 'auto' ? (
                  /* Real Embedded YouTube Player Inside Monitor Screen */
                  <iframe
                    key={activeResource.id}
                    data-testid="pc-monitor-youtube-iframe"
                    src={`https://www.youtube.com/embed/${youtubeVideoId}?rel=0`}
                    title={`Monitor Video: ${activeResource.title}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : (
                  /* Interactive FocusOS Lecture Monitor Screen (for Udemy, Custom Video Links, or Studio Deck Mode) */
                  <div
                    data-testid="pc-monitor-studio-screen"
                    className="flex-1 flex flex-col justify-between p-4 sm:p-5 bg-slate-950 text-white"
                  >
                    {/* Top Channel & Status Overlay */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            activeResource.type === 'Udemy'
                              ? 'bg-purple-700 text-white'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {activeResource.type} STREAM
                        </span>
                        <span className="text-[11px] font-mono text-emerald-400">
                          {isPlaying ? '● PLAYING ON MONITOR' : '❚❚ PAUSED'}
                        </span>
                      </div>

                      <span className="text-[11px] font-mono text-slate-400">
                        {topic.lifeArea} · {playbackSpeed}x Speed
                      </span>
                    </div>

                    {/* Center Lecture Stage inside the Monitor */}
                    <div className="my-auto py-3 flex flex-col items-center text-center space-y-3">
                      <button
                        type="button"
                        data-testid="pc-monitor-center-play-btn"
                        onClick={() => setIsPlaying((prev) => !prev)}
                        aria-label={isPlaying ? 'Pause video' : 'Play video'}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform hover:scale-105 cursor-pointer border-2 ${
                          isPlaying
                            ? 'bg-emerald-600 border-emerald-400 text-white'
                            : 'bg-blue-600 border-blue-400 text-white'
                        }`}
                      >
                        {isPlaying ? (
                          <Pause className="w-6 h-6" aria-hidden="true" />
                        ) : (
                          <Play
                            className="w-6 h-6 translate-x-0.5"
                            aria-hidden="true"
                          />
                        )}
                      </button>

                      <div className="max-w-md space-y-1">
                        <h3
                          data-testid="pc-monitor-active-title"
                          className="text-sm sm:text-base font-bold text-white font-display leading-snug"
                        >
                          {activeResource.title}
                        </h3>
                        <p className="text-[11px] font-mono text-slate-400 truncate">
                          Source: {activeResource.url}
                        </p>
                      </div>
                    </div>

                    {/* Bottom On-Screen Video Scrubber & Transport Controls */}
                    <div className="space-y-2 pt-2 border-t border-slate-800/90">
                      {/* Timeline Scrubber Bar */}
                      <div className="flex items-center gap-2 text-[10px] font-mono tabular-nums text-slate-300">
                        <span>{formatTime(progressSec)}</span>
                        <input
                          type="range"
                          min={0}
                          max={totalDurationSec}
                          value={progressSec}
                          onChange={(e) =>
                            setProgressSec(Number(e.target.value))
                          }
                          aria-label="Video timeline scrubber"
                          className="flex-1 accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />
                        <span>{formatTime(totalDurationSec)}</span>
                      </div>

                      {/* Transport Buttons Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setIsPlaying((prev) => !prev)}
                            className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            {isPlaying ? (
                              <>
                                <Pause className="w-3 h-3" />
                                <span>Pause</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3" />
                                <span>Play</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setProgressSec(0)}
                            title="Restart Video"
                            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" aria-hidden="true" />
                          </button>

                          <button
                            type="button"
                            onClick={handleNextVideo}
                            title="Next Video in PC Queue"
                            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                          >
                            <SkipForward
                              className="w-3 h-3"
                              aria-hidden="true"
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsMuted((prev) => !prev)}
                            aria-label={isMuted ? 'Unmute' : 'Mute'}
                            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                          >
                            {isMuted ? (
                              <VolumeX className="w-3 h-3 text-rose-400" />
                            ) : (
                              <Volume2 className="w-3 h-3 text-emerald-400" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const speeds: Array<1 | 1.25 | 1.5 | 2> = [
                                1, 1.25, 1.5, 2,
                              ];
                              const nextIdx =
                                (speeds.indexOf(playbackSpeed) + 1) %
                                speeds.length;
                              setPlaybackSpeed(speeds[nextIdx]);
                            }}
                            className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] font-mono font-bold text-purple-300 cursor-pointer"
                          >
                            {playbackSpeed}x
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              onToggleResource(topic.id, activeResource.id)
                            }
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                              activeResource.completed
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                            }`}
                          >
                            <Check className="w-3 h-3" aria-hidden="true" />
                            <span>
                              {activeResource.completed
                                ? 'Watched'
                                : 'Mark Watched'}
                            </span>
                          </button>

                          <a
                            href={activeResource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-md bg-purple-700 hover:bg-purple-600 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            <span>Source</span>
                            <ExternalLink
                              className="w-3 h-3"
                              aria-hidden="true"
                            />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Monitor Chin with Brand Badge & Power LED */}
              <div className="bg-slate-900 px-4 py-2 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isPcPoweredOn ? 'bg-emerald-400' : 'bg-slate-600'
                    }`}
                  />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                    FOCUSVISION PRO 27&quot; MONITOR
                  </span>
                </div>

                {activeResource && (
                  <span className="text-[10px] font-mono text-blue-400 truncate max-w-[220px]">
                    CH: {activeResource.type.toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Physical Monitor Neck & Desk Stand Base */}
            <div className="flex flex-col items-center select-none" aria-hidden="true">
              <div className="w-16 h-5 bg-slate-700 border-x-2 border-slate-800" />
              <div className="w-40 h-3 bg-slate-800 rounded-t-lg border-t border-slate-600" />
            </div>
          </div>

          {/* RIGHT (4 cols): DESKTOP PC TOWER CHASSIS & VIDEO QUEUE BAY */}
          <div
            className={
              isWidescreenExpanded ? '@xl:col-span-12' : '@xl:col-span-4'
            }
          >
            <div
              data-testid="desktop-pc-tower"
              className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 text-white flex flex-col justify-between space-y-3.5 shadow-md"
            >
              {/* Top PC Tower Front I/O Panel & Tactile Power Button */}
              <div className="pb-3 border-b border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center shrink-0">
                    <Cpu className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="text-xs font-bold tracking-wider uppercase font-display text-white">
                      FocusRig PC Tower
                    </div>
                    <div className="text-[10px] font-mono text-emerald-400">
                      {isPcPoweredOn
                        ? 'GPU STREAM READY · 60 FPS'
                        : 'SYSTEM HIBERNATING'}
                    </div>
                  </div>
                </div>

                {/* Tactile Circular PC Power Switch */}
                <button
                  type="button"
                  onClick={() => setIsPcPoweredOn((prev) => !prev)}
                  aria-label="Toggle PC Tower Power"
                  title="PC Tower Power Switch"
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer ${
                    isPcPoweredOn
                      ? 'bg-emerald-600 border-emerald-400 text-white'
                      : 'bg-slate-800 border-slate-600 text-slate-400 hover:text-white'
                  }`}
                >
                  <Power className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              {/* Front Mesh Ventilation & Solid Tri-Color Status Bars */}
              <div className="space-y-1.5" aria-hidden="true">
                <div className="grid grid-cols-3 gap-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      isPcPoweredOn ? 'bg-emerald-500' : 'bg-slate-800'
                    }`}
                  />
                  <div
                    className={`h-1.5 rounded-full ${
                      isPcPoweredOn ? 'bg-blue-500' : 'bg-slate-800'
                    }`}
                  />
                  <div
                    className={`h-1.5 rounded-full ${
                      isPcPoweredOn ? 'bg-purple-600' : 'bg-slate-800'
                    }`}
                  />
                </div>
              </div>

              {/* PC Drive Bay: Loaded Video Links Queue */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                  <span className="uppercase font-bold text-white">
                    PC Video Queue Bay
                  </span>
                  <span>
                    {videoResources.length} video
                    {videoResources.length === 1 ? '' : 's'}
                  </span>
                </div>

                {videoResources.length > 0 ? (
                  <div
                    role="list"
                    aria-label="PC video links queue"
                    className="space-y-1.5 max-h-[210px] overflow-y-auto pr-1"
                  >
                    {videoResources.map((res, index) => {
                      const isCurrentOnMonitor = activeResource?.id === res.id;
                      return (
                        <div
                          key={res.id}
                          role="listitem"
                          data-testid={`pc-video-slot-${res.id}`}
                          className={`p-2.5 rounded-xl border transition-colors flex items-center justify-between gap-2 ${
                            isCurrentOnMonitor
                              ? 'bg-blue-950/90 border-blue-500 text-white'
                              : 'bg-slate-800/90 border-slate-700/80 text-slate-200 hover:border-slate-600'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedId(res.id);
                              setIsPcPoweredOn(true);
                            }}
                            className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                          >
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                                isCurrentOnMonitor
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-700 text-slate-300'
                              }`}
                            >
                              {isCurrentOnMonitor
                                ? '▶'
                                : String(index + 1).padStart(2, '0')}
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold truncate">
                                {res.title}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                                <span>{res.type}</span>
                                <span aria-hidden="true">·</span>
                                <span>
                                  {res.completed ? '✓ Watched' : 'Ready'}
                                </span>
                              </div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteResource(topic.id, res.id)}
                            aria-label={`Remove video "${res.title}" from PC`}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 text-center space-y-1">
                    <GraduationCap
                      className="w-5 h-5 text-slate-400 mx-auto"
                      aria-hidden="true"
                    />
                    <p className="text-xs font-semibold text-slate-200">
                      No Video Links in PC Bay
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Add a YouTube or Udemy link below to load it onto the monitor.
                    </p>
                  </div>
                )}
              </div>

              {/* PC Chassis Bottom Cooling Vents */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>TEMP: 41°C · QUIET MODE</span>
                <span className="text-emerald-400">HDMI-1 ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Video Link Directly to PC Monitor Form */}
      <form
        onSubmit={handleAddVideoSubmit}
        aria-label="Add a video link to open on the PC monitor"
        className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-800">
            Add Video Link to PC (Opens Directly on Monitor Screen)
          </span>
          <span className="text-[11px] text-slate-500">
            Supports YouTube URLs, Udemy lectures, or direct .mp4 video links
          </span>
        </div>

        <div className="grid grid-cols-1 @sm:grid-cols-12 gap-2">
          <div className="@sm:col-span-2">
            <label htmlFor="pc-video-type" className="sr-only">
              Video Platform
            </label>
            <select
              id="pc-video-type"
              data-testid="pc-video-type-select"
              value={videoType}
              onChange={(e) =>
                setVideoType(e.target.value as 'YouTube' | 'Udemy')
              }
              className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-600"
            >
              <option value="YouTube">YouTube</option>
              <option value="Udemy">Udemy</option>
            </select>
          </div>

          <div className="@sm:col-span-4">
            <label htmlFor="pc-video-title" className="sr-only">
              Video Lecture Title
            </label>
            <input
              id="pc-video-title"
              data-testid="pc-video-title-input"
              type="text"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Video title (e.g., Distributed Consensus Lecture)"
              className="w-full text-xs text-slate-900 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="@sm:col-span-4">
            <label htmlFor="pc-video-url" className="sr-only">
              Video URL
            </label>
            <input
              id="pc-video-url"
              data-testid="pc-video-url-input"
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=... or Udemy link"
              className="w-full text-xs font-mono text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="@sm:col-span-2">
            <button
              type="submit"
              data-testid="pc-add-video-btn"
              disabled={!videoTitle.trim() && !videoUrl.trim()}
              className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Boot on Monitor</span>
            </button>
          </div>
        </div>
      </form>
    </section>
  );
};
