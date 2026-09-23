interface Props {
  variant?: "light" | "dark";
  /** Hoogte in px */
  size?: number;
  layout?: "inline" | "stacked";
}

const MARK_W = 120;
const MARK_H = 124;

/** Eén laag van het vinkje */
function Chevron({ dy, fill }: { dy: number; fill: string }) {
  return (
    <path
      d={`M8,${34 + dy} L52,${78 + dy} L112,${18 + dy}`}
      fill="none"
      stroke={fill}
      strokeWidth={26}
      strokeLinecap="butt"
      strokeLinejoin="miter"
    />
  );
}

function Mark() {
  return (
    <g>
      <defs>
        <linearGradient id="bc-blue" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#2B2C6B" />
          <stop offset="100%" stopColor="#1C6FB8" />
        </linearGradient>
        <linearGradient id="bc-green" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#43A82F" />
          <stop offset="100%" stopColor="#5CB431" />
        </linearGradient>
        <linearGradient id="bc-yellow" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#F4A62A" />
          <stop offset="100%" stopColor="#FBE60F" />
        </linearGradient>
      </defs>
      <Chevron dy={26} fill="url(#bc-blue)" />
      <Chevron dy={13} fill="url(#bc-green)" />
      <Chevron dy={0} fill="url(#bc-yellow)" />
    </g>
  );
}

export default function BengCertLogo({
  variant = "dark",
  size = 32,
  layout = "inline",
}: Props) {
  const textColor = variant === "light" ? "#FFFFFF" : "#28235D";
  const fontFamily = "'Poppins', system-ui, -apple-system, sans-serif";

  if (layout === "stacked") {
    const vbW = 430;
    const vbH = 220;
    return (
      <svg
        width={(size * vbW) / vbH}
        height={size}
        viewBox={`0 0 ${vbW} ${vbH}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="bengcert"
      >
        <g transform={`translate(${(vbW - MARK_W) / 2}, 0)`}>
          <Mark />
        </g>
        <text
          x={vbW / 2}
          y={212}
          textAnchor="middle"
          fontFamily={fontFamily}
          fontWeight={700}
          fontSize={76}
          fill={textColor}
          letterSpacing="-1"
        >
          bengcert
        </text>
      </svg>
    );
  }

  const vbW = 520;
  const vbH = MARK_H;
  return (
    <svg
      width={(size * vbW) / vbH}
      height={size}
      viewBox={`0 0 ${vbW} ${vbH}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="bengcert"
    >
      <Mark />
      <text
        x={140}
        y={96}
        fontFamily={fontFamily}
        fontWeight={700}
        fontSize={78}
        fill={textColor}
        letterSpacing="-1"
      >
        bengcert
      </text>
    </svg>
  );
}
