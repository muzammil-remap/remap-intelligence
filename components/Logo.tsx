import Image from 'next/image';

// REMAP Intelligence wordmark, theme-aware: both assets render and CSS
// ([data-theme] rules in globals.css) shows the right one — no JS, no
// hydration mismatch. Both PNGs are 242x60 (~4:1).
const ASPECT = 242 / 60;

export default function Logo({ height = 30 }: { height?: number }) {
  const width = Math.round(height * ASPECT);
  return (
    <>
      <Image
        className="logo-dark"
        src="/remap-logo-dark-mode.png"
        alt="REMAP Intelligence"
        height={height}
        width={width}
        priority
        style={{ height, width: 'auto' }}
      />
      <Image
        className="logo-light"
        src="/website-logo-light-mode.png"
        alt="REMAP Intelligence"
        height={height}
        width={width}
        priority
        style={{ height, width: 'auto' }}
      />
    </>
  );
}
