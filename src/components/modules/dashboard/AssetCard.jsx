import React, { useState, useEffect } from "react";
import { Card, Button, Tooltip, Grid } from "antd";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import { formatRupiah } from "src/pkg/helper";
import { useDashboard } from "src/context/DashboardContext";

export default function AssetCard({ data, loading }) {
  const { isPrivacyMode } = useDashboard();
  const [isLocalPrivate, setIsLocalPrivate] = useState(isPrivacyMode);

  useEffect(() => {
    setIsLocalPrivate(isPrivacyMode);
  }, [isPrivacyMode]);

  const screens = Grid.useBreakpoint();
  const isMobile = screens.lg === false;

  const isMasked = isPrivacyMode || isLocalPrivate;
  const rawTotalAssets = data?.total_assets ?? 0;
  const totalAssets = typeof rawTotalAssets === "number" ? rawTotalAssets : parseFloat(rawTotalAssets) || 0;

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
          padding: isMobile ? "14px 16px" : "20px 22px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
          boxSizing: "border-box",
        },
      }}
    >
      {/* Top Header: Title & Privacy Toggle */}
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
            color: "#8B949E",
            letterSpacing: "0.8px",
          }}
        >
          TOTAL ASSETS
        </span>

        <Tooltip title={isMasked ? "Show balance" : "Hide balance"}>
          <Button
            type="text"
            shape="circle"
            icon={isMasked ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={() => setIsLocalPrivate(!isMasked)}
            style={{
              color: "#8B949E",
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />
        </Tooltip>
      </div>

      {/* Main Value */}
      <div style={{ marginTop: isMobile ? 4 : 8, zIndex: 2 }}>
        <Tooltip
          title={isMasked ? "Click eye icon to reveal" : formatRupiah(totalAssets, false)}
          placement="topLeft"
        >
          <div
            style={{
              fontSize: isMobile ? 20 : 26,
              fontWeight: 800,
              color: "#F0F6FC",
              letterSpacing: "-0.5px",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {formatRupiah(totalAssets, isMasked)}
          </div>
        </Tooltip>
      </div>

      {/* Bottom Glowing Cyan/Emerald Bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background: "linear-gradient(90deg, #06B6D4 0%, #10B981 100%)",
          boxShadow: "0 0 12px rgba(6, 182, 212, 0.8), 0 -1px 8px rgba(16, 185, 129, 0.5)",
        }}
      />
    </Card>
  );
}
