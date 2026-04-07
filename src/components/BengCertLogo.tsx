interface Props {
  variant?: "light" | "dark";
  size?: number;
}

export default function BengCertLogo({ variant = "dark", size = 32 }: Props) {
  const textColor = variant === "light" ? "#FFFFFF" : "#28235D";

  return (
    <svg
      width={size * 3.5}
      height={size}
      viewBox="0 0 140 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Checkmark made of three overlapping diagonal bars */}
      {/* Yellow/gold bar */}
      <polygon
        points="12,22 16,18 28,6 32,6 20,20 16,24"
        fill="#FAC323"
      />
      {/* Green bar */}
      <polygon
        points="16,20 20,16 32,4 36,4 24,18 18,24"
        fill="#5AAF2D"
      />
      {/* Blue/navy bar */}
      <polygon
        points="20,18 24,14 36,2 40,2 28,16 22,22"
        fill="#234687"
      />
      {/* Down-stroke of checkmark — yellow */}
      <polygon
        points="6,18 12,22 16,24 20,28 16,32 10,26 4,20"
        fill="#FAC323"
      />
      {/* Down-stroke — green */}
      <polygon
        points="10,16 16,20 18,24 22,28 18,32 14,28 8,20"
        fill="#5AAF2D"
      />
      {/* Down-stroke — blue */}
      <polygon
        points="14,14 20,18 22,22 24,26 20,30 16,24 12,18"
        fill="#234687"
      />
      {/* "bengcert" text */}
      <text
        x="46"
        y="26"
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
