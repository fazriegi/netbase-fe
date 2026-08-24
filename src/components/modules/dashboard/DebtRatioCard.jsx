import React from "react";
import { Card, Grid } from "antd";

export default function DebtRatioCard({ data, loading }) {
  const screens = Grid.useBreakpoint();
  const isMobile = screens.lg === false;

  // Dynamically calculate Debt Ratio from liabilities and assets
  const rawTotalAssets = data?.total_assets ?? 0;
  const totalAssets = typeof rawTotalAssets === "number" ? rawTotalAssets : parseFloat(rawTotalAssets) || 0;

  const rawTotalLiabilities = data?.total_liabilities ?? 0;
  const totalLiabilities = typeof rawTotalLiabilities === "number" ? rawTotalLiabilities : parseFloat(rawTotalLiabilities) || 0;

  const calculatedRatio =
    totalAssets > 0
      ? (totalLiabilities / totalAssets) * 100
      : totalLiabilities > 0
        ? 100
        : 0;

  const rawRatio = data?.debt_ratio ?? calculatedRatio;
  const numRatio = typeof rawRatio === "number" ? rawRatio : parseFloat(rawRatio) || 0;
  const formattedRatio =
    numRatio % 1 !== 0
      ? numRatio.toFixed(numRatio < 10 && (numRatio * 10) % 1 !== 0 ? 2 : 1)
      : numRatio.toFixed(0);

  // SVG Gauge Arc calculations (Radius = 60, Semicircle Length = PI * R)
  const arcLength = Math.PI * 60;
  const clampedPercent = Math.min(100, Math.max(0, numRatio));
  const strokeDashoffset = arcLength * (1 - clampedPercent / 100);

  // Dynamic status color based on ratio threshold
  const statusColor =
    numRatio <= 30
      ? "#10B981"
      : numRatio <= 70
        ? "#F59E0B"
        : "#EF4444";

  return (
    <Card
      loading={loading}
      variant="borderless"
      style={{
        background: "#161B22",
        border: "1px solid #21262D",
        borderRadius: 14,
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
        height: "100%",
        minHeight: isMobile ? 128 : 148,
      }}
      styles={{
        body: {
          padding: isMobile ? "14px 16px 10px" : "18px 16px 12px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          height: "100%",
          boxSizing: "border-box",
        },
      }}
    >
      {/* Title */}
      <div style={{ width: "100%", textAlign: isMobile ? "left" : "left" }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            color: "#8B949E",
            letterSpacing: "0.8px",
          }}
        >
          DEBT RATIO
        </span>
      </div>

      {/* Semi-circle Gauge */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          width: "100%",
          marginTop: isMobile ? -2 : 0,
        }}
      >
        <svg
          viewBox="0 0 160 95"
          style={{
            width: isMobile ? 130 : 145,
            height: isMobile ? 76 : 84,
            overflow: "visible",
          }}
        >
          <defs>
            <linearGradient id="debtGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="35%" stopColor="#22C55E" />
              <stop offset="60%" stopColor="#F59E0B" />
              <stop offset="85%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#F43F5E" />
            </linearGradient>
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={statusColor} floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Background track arc */}
          <path
            d="M 20 85 A 60 60 0 0 1 140 85"
            fill="none"
            stroke="#21262D"
            strokeWidth="11"
            strokeLinecap="round"
          />

          {/* Active colorful gradient arc adjusted by ratio percentage */}
          <path
            d="M 20 85 A 60 60 0 0 1 140 85"
            fill="none"
            stroke="url(#debtGaugeGradient)"
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            filter="url(#gaugeGlow)"
            style={{
              transition: "stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />

          {/* Center value text */}
          <text
            x="80"
            y="82"
            textAnchor="middle"
            fill={statusColor}
            style={{
              fontSize: "20px",
              fontWeight: "800",
              fontFamily: "'Inter', sans-serif",
              transition: "fill 0.3s ease",
            }}
          >
            {formattedRatio}%
          </text>
        </svg>
      </div>
    </Card>
  );
}
