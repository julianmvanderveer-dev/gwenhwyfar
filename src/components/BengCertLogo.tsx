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
      {/* Three overlapping diagonal bars forming a checkmark */}
      {/* Each bar is a thick diagonal stripe; they overlap to create the checkmark shape */}
      
      {/* Yellow/gold bar — leftmost */}
      <polygon
        points="8,24 14,30 30,10 24,4"
        fill="#FAC323"
      />
      {/* Green bar — middle */}
      <polygon
        points="12,24 18,30 34,10 28,4"
        fill="#5AAF2D"
      />
      {/* Blue/navy bar — rightmost */}
      <polygon
        points="16,24 22,30 38,10 32,4"
        fill="#234687"
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
