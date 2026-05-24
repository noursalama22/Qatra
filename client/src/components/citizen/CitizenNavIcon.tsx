export type CitizenNavIconName = "home" | "request" | "orders" | "wallet" | "transfer";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

type Props = {
  name: CitizenNavIconName;
  className?: string;
};

export default function CitizenNavIcon({ name, className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`citizen-nav-svg${className ? ` ${className}` : ""}`}
      aria-hidden
    >
      {name === "home" && (
        <>
          <path {...stroke} d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
        </>
      )}
      {name === "request" && (
        <>
          <path {...stroke} d="M12 3c-4 5.5-7 9-7 12a7 7 0 0 0 14 0c0-3-3-6.5-7-12Z" />
          <path {...stroke} d="M12 14v4" />
          <path {...stroke} d="M10 18h4" />
        </>
      )}
      {name === "orders" && (
        <>
          <path {...stroke} d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <path {...stroke} d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2Z" />
          <path {...stroke} d="M9 12h6M9 16h4" />
        </>
      )}
      {name === "wallet" && (
        <>
          <path {...stroke} d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 16.5v-9Z" />
          <path {...stroke} d="M16 12h4" />
          <circle {...stroke} cx="16" cy="12" r="1" fill="currentColor" stroke="none" />
        </>
      )}
      {name === "transfer" && (
        <>
          <path {...stroke} d="M7 8h10M7 8l3-3M7 8l3 3" />
          <path {...stroke} d="M17 16H7M17 16l-3-3M17 16l-3 3" />
        </>
      )}
    </svg>
  );
}
