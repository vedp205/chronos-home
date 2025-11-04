import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react';

export default function MediaPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [mediaFile, setMediaFile] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'audio' | 'video' | null>(null);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);

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

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Media Player</h1>
        <p className="text-muted-foreground">
          Play your audio and video files
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Upload Media</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="media-file">Select Media File</Label>
              <Input
                id="media-file"
                type="file"
                accept="audio/*,video/*"
                onChange={handleFileChange}
              />
              <p className="text-sm text-muted-foreground">
                Supports MP3, MP4, and other common formats
              </p>
            </div>

            {mediaFile && mediaType === 'video' && (
              <div className="rounded-lg overflow-hidden bg-black">
                <video
                  ref={mediaRef as React.RefObject<HTMLVideoElement>}
                  src={mediaFile}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  className="w-full"
                  controls={false}
                />
              </div>
            )}

            {mediaFile && mediaType === 'audio' && (
              <audio
                ref={mediaRef as React.RefObject<HTMLAudioElement>}
                src={mediaFile}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                className="hidden"
              />
            )}

            {mediaFile && (
              <div className="space-y-6 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                  <Slider
                    value={[currentTime]}
                    max={duration}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={skipBackward}
                  >
                    <SkipBack className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    onClick={togglePlayPause}
                    className="h-12 w-12"
                  >
                    {isPlaying ? (
                      <Pause className="h-6 w-6" />
                    ) : (
                      <Play className="h-6 w-6" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={skipForward}
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  <Volume2 className="h-5 w-5 text-muted-foreground" />
                  <Slider
                    value={[volume]}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                    className="flex-1"
                  />
                </div>

                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm text-muted-foreground">Speed:</span>
                  {[0.5, 1, 1.5, 2].map((rate) => (
                    <Button
                      key={rate}
                      variant={playbackRate === rate ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePlaybackRateChange(rate)}
                    >
                      {rate}x
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}