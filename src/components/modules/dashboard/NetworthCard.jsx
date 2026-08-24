import React, { useState, useEffect } from "react";
import { Card, Button, Tooltip, Grid } from "antd";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import { formatRupiah } from "src/pkg/helper";
import { useDashboard } from "src/context/DashboardContext";

export default function NetworthCard({ data, loading }) {
  const { isPrivacyMode } = useDashboard();
  const [isLocalPrivate, setIsLocalPrivate] = useState(isPrivacyMode);

  useEffect(() => {
    setIsLocalPrivate(isPrivacyMode);
  }, [isPrivacyMode]);

  const screens = Grid.useBreakpoint();
  const isMobile = screens.lg === false;

  const isMasked = isPrivacyMode || isLocalPrivate;
  const rawNetWorth = data?.net_worth ?? 0;
  const netWorth = typeof rawNetWorth === "number" ? rawNetWorth : parseFloat(rawNetWorth) || 0;
  const rawGrowth = data?.growth_percentage ?? 0;
  const numGrowth = typeof rawGrowth === "number" ? rawGrowth : parseFloat(rawGrowth) || 0;

  const isPositiveGrowth = numGrowth > 0;
  const isNegativeGrowth = numGrowth < 0;
  const growthIcon = isNegativeGrowth ? "▼ " : isPositiveGrowth ? "▲ +" : "";
  const growthLabel = `${growthIcon}${Math.abs(numGrowth).toFixed(1)}% vs last month`;

  const badgeBg = isNegativeGrowth
    ? "rgba(239, 68, 68, 0.15)"
    : isPositiveGrowth
      ? "rgba(16, 185, 129, 0.15)"
      : "rgba(255, 255, 255, 0.08)";
  const badgeBorder = isNegativeGrowth
    ? "1px solid rgba(239, 68, 68, 0.3)"
    : isPositiveGrowth
      ? "1px solid rgba(16, 185, 129, 0.3)"
      : "1px solid rgba(255, 255, 255, 0.12)";
  const badgeColor = isNegativeGrowth
    ? "#EF4444"
    : isPositiveGrowth
      ? "#10B981"
      : "#CBD5E1";

  return (
    <Card
      loading={loading}
      variant="borderless"
      style={{
        background: "linear-gradient(135deg, #13273D 0%, #0E1A29 60%, #0B131F 100%)",
        border: "1px solid #1E3553",
        borderRadius: 14,
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
        height: "100%",
        minHeight: isMobile ? 128 : 148,
      }}
      styles={{
        body: {
          padding: isMobile ? "16px" : "20px 22px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
          boxSizing: "border-box",
        },
      }}
    >
      {/* Subtle background glow effect */}
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 120,
          height: 120,
          background: "radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(37, 99, 235, 0) 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />

      {/* Card Header: Title & Privacy Toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 2,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            color: "#94A3B8",
            letterSpacing: "0.8px",
          }}
        >
          TOTAL NET WORTH
        </span>

        <Tooltip title={isMasked ? "Show balance" : "Hide balance"}>
          <Button
            type="text"
            shape="circle"
            icon={isMasked ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={() => setIsLocalPrivate(!isMasked)}
            style={{
              color: "#94A3B8",
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />
        </Tooltip>
      </div>

      {/* Main Nominal */}
      <div style={{ marginTop: isMobile ? 4 : 8, zIndex: 2 }}>
        <Tooltip
          title={isMasked ? "Click eye icon to reveal" : formatRupiah(netWorth, false)}
          placement="topLeft"
        >
          <div
            style={{
              fontSize: isMobile ? 24 : 28,
              fontWeight: 800,
              color: "#FFFFFF",
              letterSpacing: "-0.5px",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {formatRupiah(netWorth, isMasked)}
          </div>
        </Tooltip>
      </div>

      {/* MoM Badge */}
      <div style={{ marginTop: isMobile ? 8 : 10, display: "flex", alignItems: "center", gap: 6, zIndex: 2 }}>
        <div
          style={{
            backgroundColor: badgeBg,
            border: badgeBorder,
            color: badgeColor,
            padding: "2px 8px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          {growthLabel}
        </div>
      </div>
    </Card>
  );
}
