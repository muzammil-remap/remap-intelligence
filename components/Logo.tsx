import Image from 'next/image';

// REMAP Intelligence wordmark. Uses the dark-mode asset (white + orange),
// intended for the app's dark UI. The source PNG is 242x60 (~4:1).
const ASPECT = 242 / 60;

export default function Logo({ height = 30 }: { height?: number }) {
  return (
    <Image
      src="/remap-logo-dark-mode.png"
      alt="REMAP Intelligence"
      height={height}
      width={Math.round(height * ASPECT)}
      priority
      style={{ height, width: 'auto' }}
    />
  );
}
