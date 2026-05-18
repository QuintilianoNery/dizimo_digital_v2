import React from 'react';

interface LogoMarkProps {
  src?: string | null;
  alt: string;
  size?: number;
  radius?: number;
  fallback: React.ReactNode;
  border?: string;
  background?: string;
}

export function LogoMark({
  src,
  alt,
  size = 40,
  radius = 10,
  fallback,
  border,
  background,
}: LogoMarkProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', border, background }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: background ?? 'rgba(255,255,255,.15)',
        color: 'white',
        border,
        overflow: 'hidden',
      }}
    >
      {fallback}
    </div>
  );
}