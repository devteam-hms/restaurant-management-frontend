import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

export interface BackgroundVideoProps {
  videoSrc?: string;
  webmSrc?: string;
  posterSrc?: string;
  className?: string;
  overlayOpacity?: 'default' | 'light' | 'heavy';
}

export const BackgroundVideo: React.FC<BackgroundVideoProps> = ({
  videoSrc = '/videos/restaurant-ambience.mp4',
  webmSrc,
  posterSrc = '/videos/restaurant-poster.jpg',
  className,
}) => {
  const { isDark } = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check user preference for reduced motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Attempt autoplay safely when video is ready and not reduced-motion
  useEffect(() => {
    const video = videoRef.current;
    if (!video || prefersReducedMotion || hasError) return;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // Autoplay may be restricted or waiting for interaction
        console.info('Cinematic video autoplay waiting for user context:', err);
      });
    }
  }, [prefersReducedMotion, hasError]);

  // Page Visibility API: Pause video when tab/window is hidden, resume when active
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      const video = videoRef.current;
      if (!video || prefersReducedMotion || hasError) return;

      if (document.visibilityState === 'hidden') {
        video.pause();
      } else {
        video.play().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [prefersReducedMotion, hasError]);

  return (
    <div
      className={cn(
        'fixed inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-0',
        className
      )}
      aria-hidden="true"
    >
      {/* 1. Static Poster Fallback Image (always present underneath to prevent black flash) */}
      <img
        src={posterSrc}
        alt="RMS Restaurant Ambience"
        className={cn(
          'absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000',
          isVideoLoaded && !prefersReducedMotion ? 'opacity-0' : 'opacity-100'
        )}
      />

      {/* 2. Full-Screen Cinematic Video Element */}
      {!prefersReducedMotion && !hasError && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={posterSrc}
          onCanPlay={() => setIsVideoLoaded(true)}
          onError={() => setHasError(true)}
          className={cn(
            'absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000',
            isVideoLoaded ? 'opacity-100' : 'opacity-0'
          )}
          style={{
            minWidth: '100%',
            minHeight: '100%',
          }}
        >
          {webmSrc && <source src={webmSrc} type="video/webm" />}
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}

      {/* 3. Luxury Cinematic Theme-Aware Overlay */}
      {/* Dark Theme: Deep 65-75% black gradient with subtle vignette keeping gold text crisp */}
      {/* Light Theme: Warm ivory translucent overlay preserving restaurant motion while guaranteeing AAA contrast */}
      <div
        className={cn(
          'absolute inset-0 transition-colors duration-500',
          isDark
            ? 'bg-gradient-to-b from-black/80 via-black/65 to-black/85 backdrop-blur-[0.5px]'
            : 'bg-gradient-to-b from-[#fbf9f5]/85 via-[#fbf9f5]/75 to-[#fbf9f5]/90 backdrop-blur-[0.5px]'
        )}
      />

      {/* 4. Fine-Dining Gold Ambient Glow */}
      <div
        className={cn(
          'absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[550px] rounded-full blur-[160px] pointer-events-none transition-opacity duration-700',
          isDark ? 'bg-primary/10' : 'bg-primary/15'
        )}
      />

      {/* 5. Subtle Edge Vignette for Cinematic Focus */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none mix-blend-multiply opacity-40 dark:opacity-60" />
    </div>
  );
};

