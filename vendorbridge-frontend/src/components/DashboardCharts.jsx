import React, { useState } from "react";

// Helper to format date strings to human-readable month/year
const formatMonth = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
};

// 1. AREA CHART (Smooth curved line with gradient fill)
export const AreaChart = ({ data, dataKey, xKey, color = "170, 59, 255", height = 220 }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="d-flex align-items-center justify-content-center border border-dashed rounded text-muted" style={{ height }}>
        No chart data available
      </div>
    );
  }

  const values = data.map((d) => d[dataKey] || 0);
  const maxValue = Math.max(...values, 1);
  const maxValPadded = Math.ceil(maxValue * 1.15);
  
  const width = 500;
  const padding = { top: 20, right: 20, bottom: 35, left: 45 };
  
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Coordinate scales
  const getX = (index) => {
    if (data.length <= 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (val) => {
    return padding.top + chartHeight - (val / maxValPadded) * chartHeight;
  };

  // Generate SVG points for the line
  const points = data.map((d, i) => ({
    x: getX(i),
    y: getY(d[dataKey] || 0),
    data: d
  }));

  // Create curved path using cubic bezier curves
  let pathD = "";
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
  }

  // Create fill path (closes the shape at the bottom)
  let fillD = "";
  if (points.length > 0) {
    fillD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;
  }

  // Y-axis gridlines & ticks
  const yTicks = 4;
  const gridLines = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = (maxValPadded / yTicks) * i;
    return {
      value: Math.round(val),
      y: getY(val)
    };
  });

  return (
    <div className="position-relative w-100">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-100 h-auto overflow-visible">
        <defs>
          <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`rgb(${color})`} stopOpacity="0.4" />
            <stop offset="100%" stopColor={`rgb(${color})`} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Y Axis Grid lines */}
        {gridLines.map((line, idx) => (
          <g key={idx}>
            <line
              x1={padding.left}
              y1={line.y}
              x2={width - padding.right}
              y2={line.y}
              stroke="var(--border)"
              strokeWidth="0.5"
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 10}
              y={line.y + 4}
              textAnchor="end"
              fontSize="10"
              fill="currentColor"
              opacity="0.6"
              style={{ fontFamily: "var(--mono)" }}
            >
              {line.value.toLocaleString()}
            </text>
          </g>
        ))}

        {/* Area fill */}
        {fillD && <path d={fillD} fill={`url(#gradient-${dataKey})`} />}

        {/* Line path */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke={`rgb(${color})`}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* X Axis labels */}
        {data.map((d, i) => {
          const showLabel = data.length <= 6 || i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 5) === 0;
          if (!showLabel) return null;
          return (
            <text
              key={i}
              x={getX(i)}
              y={height - padding.bottom + 18}
              textAnchor="middle"
              fontSize="10"
              fill="currentColor"
              opacity="0.65"
            >
              {formatMonth(d[xKey])}
            </text>
          );
        })}

        {/* Hover interactive bars and tooltips */}
        {points.map((p, i) => (
          <g
            key={i}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{ cursor: "pointer" }}
          >
            <rect
              x={getX(i) - (chartWidth / data.length) / 2}
              y={padding.top}
              width={chartWidth / data.length}
              height={chartHeight}
              fill="transparent"
            />

            {hoveredIndex === i && (
              <line
                x1={p.x}
                y1={padding.top}
                x2={p.x}
                y2={padding.top + chartHeight}
                stroke={`rgba(${color}, 0.3)`}
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
            )}

            <circle
              cx={p.x}
              cy={p.y}
              r={hoveredIndex === i ? 6 : 4}
              fill={hoveredIndex === i ? `rgb(${color})` : "var(--bg)"}
              stroke={`rgb(${color})`}
              strokeWidth="2.5"
              style={{ transition: "r 0.1s ease, fill 0.1s ease" }}
            />
          </g>
        ))}
      </svg>

      {hoveredIndex !== null && points[hoveredIndex] && (
        <div
          className="position-absolute shadow-lg border rounded p-2 text-start pointer-events-none"
          style={{
            left: `${((points[hoveredIndex].x - padding.left) / chartWidth) * 80 + 10}%`,
            top: "10px",
            zIndex: 10,
            background: "rgba(var(--bg-rgb, 30, 31, 38), 0.95)",
            backdropFilter: "blur(4px)",
            borderColor: `rgba(${color}, 0.4)`,
            fontSize: "12px",
            color: "var(--text-h)"
          }}
        >
          <div className="text-muted text-uppercase small font-monospace">
            {formatMonth(points[hoveredIndex].data[xKey])}
          </div>
          <div className="fw-bold fs-6 mt-1">
            {dataKey === "revenue" || dataKey === "total_amount" ? "$" : ""}
            {(points[hoveredIndex].data[dataKey] || 0).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

// 2. BAR CHART (Rounded vertical columns with hover effects)
export const BarChart = ({ data, dataKey, xKey, color = "30, 144, 255", height = 220 }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="d-flex align-items-center justify-content-center border border-dashed rounded text-muted" style={{ height }}>
        No chart data available
      </div>
    );
  }

  const values = data.map((d) => d[dataKey] || 0);
  const maxValue = Math.max(...values, 1);
  const maxValPadded = Math.ceil(maxValue * 1.1);

  const width = 500;
  const padding = { top: 20, right: 20, bottom: 35, left: 45 };
  
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getX = (index) => {
    return padding.left + (index / data.length) * chartWidth;
  };

  const getY = (val) => {
    return padding.top + chartHeight - (val / maxValPadded) * chartHeight;
  };

  const colWidth = (chartWidth / data.length) * 0.7;
  const colOffset = (chartWidth / data.length) * 0.15;

  const yTicks = 4;
  const gridLines = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = (maxValPadded / yTicks) * i;
    return {
      value: Math.round(val),
      y: getY(val)
    };
  });

  return (
    <div className="position-relative w-100">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-100 h-auto overflow-visible">
        {gridLines.map((line, idx) => (
          <g key={idx}>
            <line
              x1={padding.left}
              y1={line.y}
              x2={width - padding.right}
              y2={line.y}
              stroke="var(--border)"
              strokeWidth="0.5"
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 10}
              y={line.y + 4}
              textAnchor="end"
              fontSize="10"
              fill="currentColor"
              opacity="0.6"
              style={{ fontFamily: "var(--mono)" }}
            >
              {line.value.toLocaleString()}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const val = d[dataKey] || 0;
          const colX = getX(i) + colOffset;
          const colY = getY(val);
          const colH = padding.top + chartHeight - colY;
          const isHovered = hoveredIndex === i;

          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={colX}
                y={colY}
                width={colWidth}
                height={Math.max(colH, 2)}
                rx="4"
                fill={`rgb(${color})`}
                opacity={isHovered ? 1.0 : 0.75}
                style={{ transition: "opacity 0.15s ease, y 0.15s ease, height 0.15s ease" }}
              />
              <rect
                x={getX(i)}
                y={padding.top}
                width={chartWidth / data.length}
                height={chartHeight}
                fill="transparent"
              />
            </g>
          );
        })}

        {data.map((d, i) => {
          const label = d[xKey];
          const formattedLabel = typeof label === "string" && label.length > 15 ? label.slice(0, 12) + "..." : label;
          const showLabel = data.length <= 8 || i % Math.ceil(data.length / 8) === 0;
          if (!showLabel) return null;

          return (
            <text
              key={i}
              x={getX(i) + (chartWidth / data.length) / 2}
              y={height - padding.bottom + 18}
              textAnchor="middle"
              fontSize="10"
              fill="currentColor"
              opacity="0.65"
            >
              {formattedLabel}
            </text>
          );
        })}
      </svg>

      {hoveredIndex !== null && data[hoveredIndex] && (
        <div
          className="position-absolute shadow-lg border rounded p-2 text-start pointer-events-none"
          style={{
            left: `${((getX(hoveredIndex) - padding.left) / chartWidth) * 80 + 10}%`,
            top: "10px",
            zIndex: 10,
            background: "rgba(var(--bg-rgb, 30, 31, 38), 0.95)",
            backdropFilter: "blur(4px)",
            borderColor: `rgba(${color}, 0.4)`,
            fontSize: "12px",
            color: "var(--text-h)"
          }}
        >
          <div className="text-muted text-uppercase small font-monospace">
            {data[hoveredIndex][xKey]}
          </div>
          <div className="fw-bold fs-6 mt-1">
            {dataKey === "total_spend" || dataKey === "total_value" ? "$" : ""}
            {(data[hoveredIndex][dataKey] || 0).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

// 3. DONUT / PIE CHART (Sleek arc divisions with legend)
export const PieChart = ({ data, nameKey = "status", valueKey = "count", height = 220 }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="d-flex align-items-center justify-content-center border border-dashed rounded text-muted" style={{ height }}>
        No status data available
      </div>
    );
  }

  const colorPalette = [
    "hsl(270, 70%, 60%)",
    "hsl(200, 80%, 55%)",
    "hsl(140, 60%, 50%)",
    "hsl(360, 75%, 60%)",
    "hsl(45, 85%, 50%)",
  ];

  const total = data.reduce((sum, item) => sum + (item[valueKey] || 0), 0);
  
  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  let cumulativePercent = 0;

  const slices = data.map((d, i) => {
    const value = d[valueKey] || 0;
    const percent = total > 0 ? value / total : 0;
    
    const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
    cumulativePercent += percent;
    const [endX, endY] = getCoordinatesForPercent(cumulativePercent);

    const largeArcFlag = percent > 0.5 ? 1 : 0;
    const r = 70;
    const sx = 100 + startX * r;
    const sy = 100 + startY * r;
    const ex = 100 + endX * r;
    const ey = 100 + endY * r;

    return {
      name: d[nameKey],
      value,
      percent,
      pathData: `M 100 100 L ${sx} ${sy} A ${r} ${r} 0 ${largeArcFlag} 1 ${ex} ${ey} Z`,
      color: colorPalette[i % colorPalette.length],
      rawPercent: (percent * 100).toFixed(1)
    };
  });

  return (
    <div className="row align-items-center">
      <div className="col-sm-6 text-center">
        <svg viewBox="0 0 200 200" width="100%" height={height} className="overflow-visible">
          {slices.map((slice, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <path
                key={i}
                d={slice.pathData}
                fill={slice.color}
                opacity={hoveredIndex === null || isHovered ? 1.0 : 0.5}
                stroke="var(--bg)"
                strokeWidth="2"
                style={{
                  cursor: "pointer",
                  transition: "transform 0.15s ease, opacity 0.15s ease",
                  transform: isHovered ? "scale(1.05)" : "scale(1.0)",
                  transformOrigin: "100px 100px"
                }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
          <circle cx="100" cy="100" r="45" fill="var(--bg)" stroke="var(--border)" strokeWidth="0.5" />
          <text x="100" y="95" textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.6" style={{ letterSpacing: "0.5px" }}>
            {hoveredIndex !== null ? slices[hoveredIndex].name : "TOTAL"}
          </text>
          <text x="100" y="118" textAnchor="middle" fontSize="18" fontWeight="bold" fill="currentColor">
            {hoveredIndex !== null ? slices[hoveredIndex].value : total}
          </text>
        </svg>
      </div>

      <div className="col-sm-6">
        <div className="d-flex flex-column gap-2 text-start px-2">
          {slices.map((slice, i) => (
            <div
              key={i}
              className={`d-flex align-items-center justify-content-between p-1.5 rounded`}
              style={{
                cursor: "pointer",
                opacity: hoveredIndex === null || hoveredIndex === i ? 1.0 : 0.5,
                background: hoveredIndex === i ? "var(--accent-bg)" : "transparent"
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="d-flex align-items-center gap-2">
                <span className="rounded-circle" style={{ width: "10px", height: "10px", background: slice.color }}></span>
                <span className="small text-muted font-monospace text-capitalize">{slice.name}</span>
              </div>
              <div className="text-end font-monospace small">
                <strong className="text-body">{slice.value}</strong>{" "}
                <span className="text-muted opacity-75">({slice.rawPercent}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
