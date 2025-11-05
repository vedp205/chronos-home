import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipForward, SkipBack, Volume2, Maximize, Minimize, Upload } from 'lucide-react';

export default function MediaPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [mediaFile, setMediaFile] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'audio' | 'video' | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMediaFile(url);
      
      const fileType = file.type.startsWith('video/') ? 'video' : 'audio';
      setMediaType(fileType);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const togglePlayPause = () => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (mediaRef.current) {
      mediaRef.current.volume = newVolume;
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (mediaRef.current) {
      mediaRef.current.playbackRate = rate;
    }
  };

  const skipForward = () => {
    if (mediaRef.current) {
      mediaRef.current.currentTime = Math.min(
        mediaRef.current.currentTime + 10,
        duration
      );
    }
  };

  const skipBackward = () => {
    if (mediaRef.current) {
      mediaRef.current.currentTime = Math.max(
        mediaRef.current.currentTime - 10,
        0
      );
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useState(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  });

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Media Player</h1>
        <p className="text-muted-foreground">
          Play your audio and video files with advanced controls
        </p>
      </div>

      <div ref={containerRef} className={`${isFullscreen ? 'bg-background' : ''}`}>
        <Card className="shadow-elevated overflow-hidden border-2">
          {!mediaFile ? (
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center space-y-6 py-12">
                <div className="w-24 h-24 rounded-full bg-gradient-accent flex items-center justify-center">
                  <Upload className="w-12 h-12 text-white" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-semibold">Upload Your Media</h3>
                  <p className="text-muted-foreground max-w-md">
                    Select an audio or video file to start playing. Supports MP3, MP4, WebM, and more.
                  </p>
                </div>
                <div className="w-full max-w-md">
                  <Label 
                    htmlFor="media-file" 
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg cursor-pointer transition-all hover:scale-105"
                  >
                    <Upload className="w-5 h-5" />
                    Choose File
                  </Label>
                  <Input
                    id="media-file"
                    type="file"
                    accept="audio/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            </CardContent>
          ) : (
            <>
              <CardHeader className="border-b bg-gradient-to-r from-background to-muted/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Now Playing</CardTitle>
                  <Label 
                    htmlFor="media-file-change" 
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-md cursor-pointer transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Change File
                  </Label>
                  <Input
                    id="media-file-change"
                    type="file"
                    accept="audio/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {mediaType === 'video' && (
                  <div className="relative bg-black aspect-video">
                    <video
                      ref={mediaRef as React.RefObject<HTMLVideoElement>}
                      src={mediaFile}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      className="w-full h-full"
                      controls={false}
                    />
                  </div>
                )}

                {mediaType === 'audio' && (
                  <>
                    <audio
                      ref={mediaRef as React.RefObject<HTMLAudioElement>}
                      src={mediaFile}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      className="hidden"
                    />
                    <div className="h-64 bg-gradient-accent flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="w-20 h-20 mx-auto rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Volume2 className="w-10 h-10 text-white" />
                        </div>
                        <p className="text-white text-lg font-medium">Audio Playing</p>
                      </div>
                    </div>
                  </>
                )}

                <div className="p-6 space-y-6 bg-card">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Slider
                      value={[currentTime]}
                      max={duration}
                      step={0.1}
                      onValueChange={handleSeek}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground font-medium">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Playback Controls */}
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={skipBackward}
                      className="h-11 w-11"
                    >
                      <SkipBack className="h-5 w-5" />
                    </Button>
                    <Button
                      size="icon"
                      onClick={togglePlayPause}
                      className="h-14 w-14 bg-gradient-accent hover:opacity-90 transition-all hover:scale-105"
                    >
                      {isPlaying ? (
                        <Pause className="h-7 w-7" />
                      ) : (
                        <Play className="h-7 w-7 ml-1" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={skipForward}
                      className="h-11 w-11"
                    >
                      <SkipForward className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Volume and Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Volume Control */}
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                      <Volume2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <Slider
                        value={[volume]}
                        max={1}
                        step={0.01}
                        onValueChange={handleVolumeChange}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium text-muted-foreground w-12 text-right">
                        {Math.round(volume * 100)}%
                      </span>
                    </div>

                    {/* Fullscreen Control */}
                    {mediaType === 'video' && (
                      <div className="flex items-center justify-end">
                        <Button
                          variant="outline"
                          onClick={toggleFullscreen}
                          className="gap-2"
                        >
                          {isFullscreen ? (
                            <>
                              <Minimize className="h-4 w-4" />
                              Exit Fullscreen
                            </>
                          ) : (
                            <>
                              <Maximize className="h-4 w-4" />
                              Fullscreen
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Playback Speed */}
                  <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium text-muted-foreground">Playback Speed:</span>
                    {[0.5, 1, 1.5, 2].map((rate) => (
                      <Button
                        key={rate}
                        variant={playbackRate === rate ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePlaybackRateChange(rate)}
                        className={playbackRate === rate ? 'bg-gradient-accent' : ''}
                      >
                        {rate}x
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}