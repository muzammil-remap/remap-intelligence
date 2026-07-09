'use client';

// Light/dark switch. The current theme lives on <html data-theme> (set before
// paint by the inline script in app/layout.tsx); which icon shows is pure CSS
// ([data-theme] rules), so this component renders identically on the server
// and never causes a hydration mismatch.
export default function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try {
      localStorage.setItem('remap-theme', next);
    } catch {
      // localStorage unavailable (private mode) — theme still switches for the session
    }
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label="Toggle light / dark theme"
      title="Toggle theme"
    >
      {/* Sun — shown in dark mode (click → light) */}
      <svg
        className="icon-sun"
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
      {/* Moon — shown in light mode (click → dark) */}
      <svg
        className="icon-moon"
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  );
}
