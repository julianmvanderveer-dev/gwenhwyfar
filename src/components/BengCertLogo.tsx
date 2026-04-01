interface Props {
  variant?: "light" | "dark";
  size?: number;
}

export default function BengCertLogo({ variant = "dark", size = 32 }: Props) {
  const textColor = variant === "light" ? "#FFFFFF" : "#1B2A4A";
  const accentColor = "#7AB929";
  const scale = size / 32;

  return (
    <svg
      width={size * 3.2}
      height={size}
      viewBox="0 0 102 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: `scale(${scale})`, transformOrigin: "left center" }}
    >
      {/* First checkmark */}
      <path
        d="M4 16L10 22L22 8"
        stroke={accentColor}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Second checkmark (overlapping, offset) */}
      <path
        d="M10 16L16 22L28 8"
        stroke={accentColor}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
      {/* "beng" text */}
      <text
        x="32"
        y="23"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="700"
        fontSize="20"
        fill={textColor}
      >
        beng
      </text>
      {/* "cert" text */}
      <text
        x="70"
        y="23"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="700"
        fontSize="20"
        fill={accentColor}
      >
        cert
      </text>
    </svg>
  );
}
