type LogoProps = {
  className?: string;
  variant?: "default" | "light";
  showWordmark?: boolean;
};

export default function Logo({ className = "", variant = "default", showWordmark = true }: LogoProps) {
  const wordClass = variant === "light" ? "logo-wordmark logo-wordmark-light" : "logo-wordmark";

  return (
    <div className={`logo ${className}`.trim()}>
      <div className="logo-mark" aria-hidden>
        <svg viewBox="0 0 32 32" className="logo-svg">
          <defs>
            <linearGradient id="qatra-logo-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>
          <path
            d="M16 2 C 9 12, 5 17, 5 21 a11 11 0 0 0 22 0 C 27 17, 23 12, 16 2 Z"
            fill="url(#qatra-logo-gradient)"
          />
          <circle cx="16" cy="21" r="3" fill="white" />
          <circle cx="16" cy="21" r="1.3" fill="#2563eb" />
        </svg>
      </div>
      {showWordmark && (
        <span className={wordClass}>
          Qatra <span className="logo-ar">قطرة</span>
        </span>
      )}
    </div>
  );
}
