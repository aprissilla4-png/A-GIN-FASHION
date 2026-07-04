import React, { useRef, useEffect } from "react";

interface VideoPlayerProps {
  src: string;
  className?: string;
  onClick?: () => void;
}

export default function VideoPlayer({ src, className, onClick }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && src) {
            videoRef.current?.play().catch(e => console.log("Autoplay handled/deferred:", e.message));
          } else {
            videoRef.current?.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    const currentVideo = videoRef.current;
    if (currentVideo) observer.observe(currentVideo);

    return () => {
      if (currentVideo) observer.unobserve(currentVideo);
    };
  }, [src]);

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
