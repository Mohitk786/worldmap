/** The same globe-ring-and-pin mark used for the favicon, rendered inline in the UI. */
export function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }} aria-hidden>
      <span
        className="absolute inset-0 rounded-full border-2 border-gold"
        style={{ borderWidth: Math.max(2, size * 0.1) }}
      />
      <span
        className="absolute rounded-full bg-gold"
        style={{ width: size * 0.32, height: size * 0.32, top: -size * 0.06, right: -size * 0.06 }}
      />
    </span>
  );
}
