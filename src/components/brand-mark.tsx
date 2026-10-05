/**
 * The app mark: open scissors (for "trim") with emerald handles, the logo's accent colour, on a
 * dark square. Drawn as SVG so it stays sharp at favicon size. Used by the generated icons and
 * share card, so it uses SVG attributes rather than Tailwind classes.
 */
export function BrandMark({ size, rounded = true }: { size: number; rounded?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect width="32" height="32" rx={rounded ? 7 : 0} fill="#18181b" />
      {/* Drawn on a 24px grid (handles on the left, blades to the right), scaled to fit. */}
      <g
        transform="translate(3.35 2.8) scale(1.1)"
        fill="none"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 4 8.12 15.88M8.12 8.12 12 12M14.8 14.8 20 20" stroke="#fff" />
        <circle cx="6" cy="6" r="3" stroke="#10b981" />
        <circle cx="6" cy="18" r="3" stroke="#10b981" />
      </g>
    </svg>
  );
}
