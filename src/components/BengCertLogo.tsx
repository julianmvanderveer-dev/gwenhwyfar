interface Props {
  variant?: "light" | "dark";
  size?: number;
}

export default function BengCertLogo({ variant = "dark", size = 32 }: Props) {
  const textColor = variant === "light" ? "#FFFFFF" : "#28235D";
  const scale = size / 40;

  return (
    <svg
      width={140 * scale}
      height={40 * scale}
      viewBox="0 0 140 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Two overlapping green checkmarks */}
      {/* First checkmark (left, slightly darker green) */}
      <path
        d="M6,18 L14,26 L30,8"
        fill="none"
        stroke="#4a9e24"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Second checkmark (right, brighter green, overlapping) */}
      <path
        d="M14,18 L22,26 L38,8"
        fill="none"
        stroke="#5AAF2D"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* "bengcert" text */}
      <text
        x="46"
        y="27"
        fontFamily="'Poppins', system-ui, -apple-system, sans-serif"
        fontWeight="700"
        fontSize="18"
        fill={textColor}
        letterSpacing="0.5"
      >
        bengcert
      </text>
    </svg>
  );
}
