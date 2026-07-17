import React, { useRef, useEffect, useState } from "react";

interface VideoPlayerProps {
  src: string;
  className?: string;
  onClick?: () => void;
}

export function getYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/);
  return match ? match[1] : null;
}

export default function VideoPlayer({ src, className, onClick }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytId = getYoutubeId(src);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || ytId) return; // Skip observer for youtube thumbnails

    let isPlaying = false;
    let playPromise: Promise<void> | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && src) {
            if (!isPlaying) {
              isPlaying = true;
              playPromise = video.play();
              playPromise.catch((err) => {
                console.log("Autoplay handled/deferred:", err.message);
                isPlaying = false;
              });
            }
          } else {
            if (isPlaying) {
              if (playPromise) {
                playPromise
                  .then(() => {
                    video.pause();
                    isPlaying = false;
                  })
                  .catch(() => {
                    video.pause();
                    isPlaying = false;
                  });
              } else {
                video.pause();
                isPlaying = false;
              }
            } else {
              video.pause();
            }
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(video);

    return () => {
      observer.unobserve(video);
      if (video) {
        video.pause();
      }
    };
  }, [src, ytId]);

  if (ytId) {
    return (
      <img 
        src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`} 
        className={className} 
        onClick={onClick} 
        alt="Video Thumbnail"
      />
    );
  }

  return (
    <video
      ref={videoRef}
      src={src}
      className={className}
      muted
      playsInline
      loop
      onClick={onClick}
    />
  );
}
