type Variant = "plant" | "truck" | "droplet";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export default function CitizenProviderIcon({ variant }: { variant: Variant }) {
  return (
    <svg viewBox="0 0 24 24" className="citizen-provider-svg" aria-hidden>
      {variant === "plant" && (
        <>
          <path {...stroke} d="M4 20h16M6 20V10l6-4 6 4v10" />
          <path {...stroke} d="M10 14h4v6" />
          <path {...stroke} d="M12 6v4" />
        </>
      )}
      {variant === "truck" && (
        <>
          <path {...stroke} d="M3 8h11v8H3zM14 10h4l2 3v3h-6z" />
          <circle {...stroke} cx="7" cy="18" r="2" />
          <circle {...stroke} cx="17" cy="18" r="2" />
        </>
      )}
      {variant === "droplet" && (
        <path {...stroke} d="M12 3c-4 5.5-7 9-7 12a7 7 0 0 0 14 0c0-3-3-6.5-7-12Z" />
      )}
    </svg>
  );
}
