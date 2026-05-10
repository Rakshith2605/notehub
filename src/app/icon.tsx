import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1f1f1f',
          color: '#ededed',
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: -0.5,
          borderRadius: 6,
          border: '1.5px solid #3b82f6',
        }}
      >
        NH
      </div>
    ),
    { ...size }
  );
}
