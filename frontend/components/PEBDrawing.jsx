import React, { useMemo } from "react";

const DEFAULT_WIDTH = 24000;
const DEFAULT_HEIGHT = 6000;
const DEFAULT_BAY_SPACING = 6000;

export default function PEBDrawing({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  baySpacing = DEFAULT_BAY_SPACING,
}) {
  const drawing = useMemo(() => {
    const marginX = 800;
    const marginY = 700;
    const roofRise = Math.max(height * 0.18, 900);
    const span = Math.max(width, 1);
    const stroke = "#2b2b2b";
    const lightStroke = "#8a8a8a";
    const gridStroke = "#ececec";
    const baseY = marginY + height;
    const ridgeX = marginX + span / 2;
    const ridgeY = baseY - roofRise;
    const leftX = marginX;
    const rightX = marginX + span;
    const bayCount = Math.max(1, Math.round(span / Math.max(baySpacing, 1)));

    const bayLines = [];
    for (let i = 1; i < bayCount; i += 1) {
      const x = marginX + (span * i) / bayCount;
      bayLines.push(x);
    }

    const gridLines = [];
    const verticalStep = Math.max(span / 12, 1000);
    for (let x = marginX + verticalStep; x < rightX; x += verticalStep) {
      gridLines.push({ x1: x, y1: marginY - 200, x2: x, y2: baseY + 900 });
    }
    const horizontalStep = Math.max(height / 8, 600);
    for (let y = marginY; y <= baseY; y += horizontalStep) {
      gridLines.push({ x1: marginX - 400, y1: y, x2: rightX + 400, y2: y });
    }

    return {
      baseY,
      ridgeX,
      ridgeY,
      leftX,
      rightX,
      bayLines,
      gridLines,
      widthLabelX: marginX + span / 2,
      heightLabelY: marginY + height / 2,
      vbWidth: span + marginX * 2,
      vbHeight: height + roofRise + marginY * 2 + 1800,
    };
  }, [height, baySpacing, width]);

  return (
    <svg
      viewBox={`0 0 ${drawing.vbWidth} ${drawing.vbHeight}`}
      width="100%"
      height="100%"
      role="img"
      aria-label={`PEB drawing with width ${width} and height ${height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ background: "#ffffff", display: "block" }}
    >
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#2b2b2b" />
        </marker>
        <marker
          id="arrow-light"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#8a8a8a" />
        </marker>
      </defs>

      {drawing.gridLines.map((line, index) => (
        <line
          key={`grid-${index}`}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={gridStroke}
          strokeWidth="1"
        />
      ))}

      <line
        x1={drawing.leftX}
        y1={drawing.baseY}
        x2={drawing.ridgeX}
        y2={drawing.ridgeY}
        stroke={stroke}
        strokeWidth="5"
      />
      <line
        x1={drawing.ridgeX}
        y1={drawing.ridgeY}
        x2={drawing.rightX}
        y2={drawing.baseY}
        stroke={stroke}
        strokeWidth="5"
      />

      <line
        x1={drawing.leftX}
        y1={drawing.baseY}
        x2={drawing.leftX}
        y2={drawing.baseY + 600}
        stroke={stroke}
        strokeWidth="5"
      />
      <line
        x1={drawing.rightX}
        y1={drawing.baseY}
        x2={drawing.rightX}
        y2={drawing.baseY + 600}
        stroke={stroke}
        strokeWidth="5"
      />

      {drawing.bayLines.map((x, index) => (
        <g key={`bay-${index}`}>
          <line
            x1={x}
            y1={drawing.baseY}
            x2={x}
            y2={drawing.baseY + 460}
            stroke={lightStroke}
            strokeWidth="3"
            strokeDasharray="10 8"
          />
        </g>
      ))}

      <line
        x1={drawing.leftX}
        y1={drawing.baseY + 900}
        x2={drawing.rightX}
        y2={drawing.baseY + 900}
        stroke={stroke}
        strokeWidth="2.5"
        markerStart="url(#arrow)"
        markerEnd="url(#arrow)"
      />
      <line
        x1={drawing.leftX}
        y1={drawing.baseY + 760}
        x2={drawing.leftX}
        y2={drawing.baseY + 1040}
        stroke={stroke}
        strokeWidth="2"
      />
      <line
        x1={drawing.rightX}
        y1={drawing.baseY + 760}
        x2={drawing.rightX}
        y2={drawing.baseY + 1040}
        stroke={stroke}
        strokeWidth="2"
      />
      <text
        x={drawing.widthLabelX}
        y={drawing.baseY + 850}
        textAnchor="middle"
        fontSize="36"
        fill={stroke}
        fontFamily="Arial, Helvetica, sans-serif"
      >
        Width: {width}
      </text>

      <line
        x1={drawing.rightX + 950}
        y1={drawing.baseY}
        x2={drawing.rightX + 950}
        y2={drawing.ridgeY}
        stroke={stroke}
        strokeWidth="2.5"
        markerStart="url(#arrow)"
        markerEnd="url(#arrow)"
      />
      <line
        x1={drawing.rightX + 810}
        y1={drawing.baseY}
        x2={drawing.rightX + 1090}
        y2={drawing.baseY}
        stroke={stroke}
        strokeWidth="2"
      />
      <line
        x1={drawing.rightX + 810}
        y1={drawing.ridgeY}
        x2={drawing.rightX + 1090}
        y2={drawing.ridgeY}
        stroke={stroke}
        strokeWidth="2"
      />
      <text
        x={drawing.rightX + 1160}
        y={drawing.heightLabelY}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize="36"
        fill={stroke}
        fontFamily="Arial, Helvetica, sans-serif"
        transform={`rotate(-90 ${drawing.rightX + 1160} ${drawing.heightLabelY})`}
      >
        Height: {height}
      </text>

      <text
        x={drawing.ridgeX}
        y={drawing.ridgeY - 40}
        textAnchor="middle"
        fontSize="28"
        fill={lightStroke}
        fontFamily="Arial, Helvetica, sans-serif"
      >
        PEB Frame
      </text>
    </svg>
  );
}
