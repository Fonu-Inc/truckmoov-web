import { formatClockDuration } from "@truckmoov/app-core/utils/time-utils";
import {
  Download, Pause, Play, RotateCcw, Volume2, VolumeX,
} from "lucide-react";
import {
  useEffect, useRef, useState,
} from "react";
import { Button } from "@/components/shadcn/button";
import { Slider } from "@/components/shadcn/slider";
import { cn } from "@/lib/utils";

type CallRecordingPlayerProps = {
  recordingUrl: string;
  duration?: number;
  className?: string;
};

export function CallRecordingPlayer({
  recordingUrl, duration, className,
}: CallRecordingPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [
    isPlaying,
    setIsPlaying,
  ] = useState(false);
  const [
    currentTime,
    setCurrentTime,
  ] = useState(0);
  const [
    audioDuration,
    setAudioDuration,
  ] = useState(duration || 0);
  const [volume] = useState(1);
  const [
    isMuted,
    setIsMuted,
  ] = useState(false);
  const [
    isLoading,
    setIsLoading,
  ] = useState(true);
  const [
    error,
    setError,
  ] = useState<string | null>(null);

  useEffect(
    () => {
      const audio = audioRef.current;
      if (!audio)
        return;

      const handleLoadedMetadata = () => {
        setAudioDuration(audio.duration);
        setIsLoading(false);
      };

      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      const handleError = () => {
        setError("Failed to load recording");
        setIsLoading(false);
      };

      audio.addEventListener(
        "loadedmetadata",
        handleLoadedMetadata,
      );
      audio.addEventListener(
        "timeupdate",
        handleTimeUpdate,
      );
      audio.addEventListener(
        "ended",
        handleEnded,
      );
      audio.addEventListener(
        "error",
        handleError,
      );

      return () => {
        audio.removeEventListener(
          "loadedmetadata",
          handleLoadedMetadata,
        );
        audio.removeEventListener(
          "timeupdate",
          handleTimeUpdate,
        );
        audio.removeEventListener(
          "ended",
          handleEnded,
        );
        audio.removeEventListener(
          "error",
          handleError,
        );
      };
    },
    [],
  );

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio)
      return;

    if (isPlaying) {
      audio.pause();
    }
    else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio)
      return;

    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio)
      return;

    if (isMuted) {
      audio.volume = volume || 1;
      setIsMuted(false);
    }
    else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const handleRestart = () => {
    const audio = audioRef.current;
    if (!audio)
      return;

    audio.currentTime = 0;
    setCurrentTime(0);
    if (!isPlaying) {
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = recordingUrl;
    link.download = `call-recording-${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return (
      <div className={cn(
        "flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm",
        className,
      )}
      >
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg bg-muted/50",
      className,
    )}
    >
      <audio
        ref={audioRef}
        src={recordingUrl}
        preload="metadata"
      />

      {/* Play/Pause Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={togglePlay}
        disabled={isLoading}
      >
        {isPlaying
          ? (
              <Pause className="h-4 w-4" />
            )
          : (
              <Play className="h-4 w-4" />
            )}
      </Button>

      {/* Time & Progress */}
      <div className="flex-1 space-y-1">
        <Slider
          value={[currentTime]}
          max={audioDuration || 1}
          step={0.1}
          onValueChange={handleSeek}
          className="cursor-pointer"
          disabled={isLoading}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatClockDuration(currentTime)}</span>
          <span>{formatClockDuration(audioDuration)}</span>
        </div>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={toggleMute}
        >
          {isMuted
            ? (
                <VolumeX className="h-4 w-4" />
              )
            : (
                <Volume2 className="h-4 w-4" />
              )}
        </Button>
      </div>

      {/* Restart */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleRestart}
        disabled={isLoading}
      >
        <RotateCcw className="h-4 w-4" />
      </Button>

      {/* Download */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleDownload}
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}
