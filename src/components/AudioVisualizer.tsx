import { useEffect, useRef } from "react";

interface Props {
  analyserNode: AnalyserNode | null;
  active: boolean;
}

const BAR_COUNT = 5;
const BAR_WIDTH = 3;
const GAP = 2;
const HEIGHT = 24;

export default function AudioVisualizer({ analyserNode, active }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active || !analyserNode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
    const totalWidth = BAR_COUNT * BAR_WIDTH + (BAR_COUNT - 1) * GAP;
    canvas.width = totalWidth;
    canvas.height = HEIGHT;

    const draw = () => {
      analyserNode.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Pick evenly spaced bins
      const step = Math.max(1, Math.floor(dataArray.length / BAR_COUNT));

      for (let i = 0; i < BAR_COUNT; i++) {
        const value = dataArray[i * step] / 255;
        const barHeight = Math.max(3, value * HEIGHT);
        const x = i * (BAR_WIDTH + GAP);
        const y = (HEIGHT - barHeight) / 2;

        ctx.fillStyle = "hsl(93, 64%, 44%)"; // primary green
        ctx.beginPath();
        ctx.roundRect(x, y, BAR_WIDTH, barHeight, 1);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [active, analyserNode]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="shrink-0"
      style={{ width: BAR_COUNT * BAR_WIDTH + (BAR_COUNT - 1) * GAP, height: HEIGHT }}
    />
  );
}
