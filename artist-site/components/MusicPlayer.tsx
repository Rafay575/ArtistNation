'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useArtist } from '@/contexts/ArtistContext';
import { FiPlay, FiPause, FiSkipBack, FiSkipForward } from 'react-icons/fi';

interface Track {
  audioUrl: string;
  trackTitle: string;
  artistName: string;
  coverImage?: string;
  album?: string;
  genre?: string;
}

export default function MusicSection({ content }: { content: any }) {
  const { settings } = useArtist();
  const primaryColor = settings?.primary_color || '#5D2FDB';

  // Support both old single-track and new multi-track content
  let tracks: Track[] = [];

  if (Array.isArray(content?.tracks) && content.tracks.length > 0) {
    tracks = content.tracks;
  } else if (content?.audioUrl) {
    // Fallback for old single-track format
    tracks = [
      {
        audioUrl: content.audioUrl,
        trackTitle: content.trackTitle || 'Untitled',
        artistName: content.artistName || 'Unknown Artist',
        coverImage: content.coverImage,
      },
    ];
  }

  const heading = content?.heading || 'Music';
  const description =
    content?.description ||
    "Music is the way to express your emotions and the thing you enjoyed most in life – it's one of the most important parts of our lives.";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = tracks[currentIndex] || tracks[0];

  // When currentIndex changes, load new source and reset playing state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
      setIsPlaying(false);
    }
  }, [currentIndex]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const playNext = () => {
    if (tracks.length === 0) return;
    const next = (currentIndex + 1) % tracks.length;
    setCurrentIndex(next);
  };

  const playPrevious = () => {
    if (tracks.length === 0) return;
    const prev = (currentIndex - 1 + tracks.length) % tracks.length;
    setCurrentIndex(prev);
  };

  // Auto‑play when user clicks a different track
  const handleTrackSelect = (index: number) => {
    if (index === currentIndex) {
      // Toggle play/pause for current track
      togglePlayPause();
    } else {
      setCurrentIndex(index);
    }
  };

  // Sync audio element play state with our isPlaying
  const handleAudioPlay = () => setIsPlaying(true);
  const handleAudioPause = () => setIsPlaying(false);
  const handleAudioEnded = () => {
    // Auto‑play next when current track ends
    if (tracks.length > 1) {
      playNext();
    } else {
      setIsPlaying(false);
    }
  };

  return (
    <section className="relative py-[50px] lg:py-[80px] bg-[#F6EDEE]">
      <div className="container relative z-2">
        <h2 className="text-center text-4xl md:text-5xl font-bold text-primary">
          {heading}
        </h2>
        <p className="text-center text-gray-500 mt-4 w-full max-w-xl mx-auto">
          {description}
        </p>

        {tracks.length > 0 ? (
          <div className="mt-10 md:mt-16">
            <div
              className="p-2 md:p-5 lg:p-8 rounded-2xl max-w-5xl mx-auto"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="bg-white rounded-2xl p-4">
                {/* Current track display */}
                <div className="flex flex-col md:flex-row gap-5 md:items-center">
                  {/* Cover */}
                  <div className="w-28 h-28 md:w-40 md:h-40 relative overflow-hidden rounded-xl flex-shrink-0">
                    <Image
                      src={currentTrack?.coverImage || '/about2.png'}
                      alt={currentTrack?.trackTitle}
                      unoptimized={true}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Player */}
                  <div className="flex-1 w-full">
                    <h3 className="text-2xl md:text-3xl font-semibold text-primary">
                      {currentTrack?.trackTitle}
                    </h3>
                    <p className="text-gray-500 mt-1">{currentTrack?.artistName}</p>
                    {currentTrack?.album && (
                      <p className="text-gray-400 text-sm">{currentTrack.album}</p>
                    )}

                    {/* Custom HTML5 audio player */}
                    <audio
                      ref={audioRef}
                      src={currentTrack?.audioUrl}
                      onPlay={handleAudioPlay}
                      onPause={handleAudioPause}
                      onEnded={handleAudioEnded}
                      className="hidden"
                      preload="auto"
                    />

                    {/* Playback controls */}
                    <div className="flex items-center gap-4 mt-4">
                      <button
                        onClick={playPrevious}
                        className="p-2 rounded-full hover:bg-gray-100"
                        aria-label="Previous track"
                      >
                        <FiSkipBack size={24} className="text-gray-700" />
                      </button>

                      <button
                        onClick={togglePlayPause}
                        className="p-3 rounded-full text-white"
                        style={{ backgroundColor: primaryColor }}
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? <FiPause size={28} /> : <FiPlay size={28} />}
                      </button>

                      <button
                        onClick={playNext}
                        className="p-2 rounded-full hover:bg-gray-100"
                        aria-label="Next track"
                      >
                        <FiSkipForward size={24} className="text-gray-700" />
                      </button>

                      {/* Progress bar */}
                      <div className="flex-1 mx-4">
                        <input
                          type="range"
                          min="0"
                          max={audioRef.current?.duration || 0}
                          value={audioRef.current?.currentTime || 0}
                          onChange={(e) => {
                            if (audioRef.current) {
                              audioRef.current.currentTime = Number(e.target.value);
                            }
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, ${primaryColor} ${((audioRef.current?.currentTime || 0) / (audioRef.current?.duration || 1)) * 100}%, #e5e7eb 0%)`,
                          }}
                        />
                      </div>

                      <span className="text-sm text-gray-500 min-w-[40px]">
                        {audioRef.current?.currentTime
                          ? new Date(audioRef.current.currentTime * 1000)
                              .toISOString()
                              .substr(14, 5)
                          : '0:00'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Track list */}
                <div className="mt-6 border-t pt-4">
                  <p className="text-sm font-semibold text-gray-500 mb-2">Track List</p>
                  <div className="space-y-2">
                    {tracks.map((track, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleTrackSelect(idx)}
                        className={`flex items-center w-full text-left p-2 rounded-lg transition ${
                          idx === currentIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-8 h-8 relative rounded overflow-hidden flex-shrink-0 mr-3">
                          <Image
                            src={track.coverImage || '/about2.png'}
                            alt={track.trackTitle}
                            unoptimized={true}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{track.trackTitle}</p>
                          <p className="text-xs text-gray-500">{track.artistName}</p>
                        </div>
                        {idx === currentIndex && isPlaying && (
                          <span className="text-xs px-2 py-1 rounded-full bg-primary text-white">Now Playing</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">No tracks added yet.</div>
        )}
      </div>

      {/* Overlay image (unchanged) */}
      <Image
        src="/overlay1.png"
        alt="overlay"
        width={300}
        height={400}
        className="w-[100px] absolute top-10 right-0 z-1"
      />
    </section>
  );
}