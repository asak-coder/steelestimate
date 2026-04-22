"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, Group, Layer, Line, Rect, Stage } from "react-konva";
import { convertAreaFromSquareMeters, formatAreaValue } from "../lib/converter";

type ShapeKind = "ismb" | "pipe" | "plate";

type ShapePreviewProps = {
  shape: ShapeKind;
  lengthMeters: number;
  areaSquareMeters: number;
  className?: string;
};

const SHAPE_LABELS: Record<ShapeKind, string> = {
  ismb: "I-beam",
  pipe: "Pipe",
  plate: "Plate",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function useAnimatedValue(target: number, duration = 240) {
  const [value, setValue] = useState(target);
  const currentValueRef = useRef(target);

  useEffect(() => {
    currentValueRef.current = value;
  }, [value]);

  useEffect(() => {
    const start = currentValueRef.current;
    const startTime = performance.now();

    let frame = 0;

    const step = (timestamp: number) => {
      const progress = clamp((timestamp - startTime) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(start + (target - start) * eased);

      if (progress < 1) {
        frame = window.requestAnimationFrame(step);
      }
    };

    frame = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [duration, target]);

  return value;
}

export default function ShapePreview({
  shape,
  lengthMeters,
  areaSquareMeters,
  className = "",
}: ShapePreviewProps) {
  const label = SHAPE_LABELS[shape] ?? "Section";
  const animatedLength = useAnimatedValue(lengthMeters);

  const { width, height, scaleX, scaleY } = useMemo(() => {
    const lengthScale = clamp(0.85 + animatedLength / 8, 0.85, 1.75);

    if (shape === "pipe") {
      return {
        width: 280,
        height: 220,
        scaleX: clamp(0.88 + animatedLength / 18, 0.88, 1.35),
        scaleY: 1,
      };
    }

    if (shape === "plate") {
      return {
        width: 280,
        height: 220,
        scaleX: lengthScale,
        scaleY: 1,
      };
    }

    return {
      width: 280,
      height: 220,
      scaleX: lengthScale,
      scaleY: 1,
    };
  }, [animatedLength, shape]);

  const areaSqMm = areaSquareMeters * 1_000_000;
  const areaSqFt = convertAreaFromSquareMeters(areaSquareMeters, "sqft");

  return (
    <div className={className}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="industrial-label">Shape preview</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{label}</h3>
        </div>
        <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          {lengthMeters.toFixed(2)} m
        </span>
      </div>

      <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/80 p-3 shadow-inner shadow-black/20">
        <Stage width={width} height={height} className="h-auto w-full">
          <Layer>
            <Group x={width / 2} y={height / 2} scaleX={scaleX} scaleY={scaleY}>
              <Rect
                x={-118}
                y={-88}
                width={236}
                height={176}
                cornerRadius={24}
                fill="#0b1220"
                stroke="#1e293b"
                strokeWidth={2}
              />
              {shape === "pipe" ? (
                <>
                  <Circle
                    x={0}
                    y={0}
                    radius={72}
                    stroke="#38bdf8"
                    strokeWidth={18}
                    fill="#0f172a"
                    shadowColor="rgba(56, 189, 248, 0.18)"
                    shadowBlur={16}
                  />
                  <Circle x={0} y={0} radius={40} fill="#020617" stroke="#1f2937" strokeWidth={2} />
                </>
              ) : shape === "plate" ? (
                <>
                  <Rect
                    x={-80}
                    y={-36}
                    width={160}
                    height={72}
                    cornerRadius={16}
                    fill="#38bdf8"
                    opacity={0.92}
                    shadowColor="rgba(56, 189, 248, 0.22)"
                    shadowBlur={16}
                  />
                  <Rect
                    x={-112}
                    y={-56}
                    width={224}
                    height={112}
                    cornerRadius={20}
                    stroke="rgba(125, 211, 252, 0.28)"
                    strokeWidth={2}
                    fillEnabled={false}
                  />
                </>
              ) : (
                <>
                  <Rect x={-92} y={-72} width={184} height={28} cornerRadius={10} fill="#38bdf8" />
                  <Rect x={-92} y={44} width={184} height={28} cornerRadius={10} fill="#38bdf8" />
                  <Rect
                    x={-12}
                    y={-44}
                    width={24}
                    height={88}
                    cornerRadius={8}
                    fill="#7dd3fc"
                  />
                  <Line
                    points={[-92, -58, 92, -58]}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={2}
                  />
                </>
              )}
            </Group>
          </Layer>
        </Stage>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MetricCard label="Area" value={formatAreaValue(areaSquareMeters, "sqm", 4)} />
        <MetricCard label="Area (mm²)" value={new Intl.NumberFormat("en-IN").format(areaSqMm)} />
        <MetricCard label="Area (ft²)" value={formatAreaValue(areaSqFt, "sqft", 4)} />
      </div>
    </div>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
};

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}
