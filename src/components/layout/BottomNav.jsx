import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  HomeOutlined,
  PieChartOutlined,
  CreditCardOutlined,
  RiseOutlined,
} from "@ant-design/icons";

const NAV_ITEMS = [
  {
    key: "/",
    label: "Home",
    icon: HomeOutlined,
  },
  {
    key: "/assets",
    label: "Assets",
    icon: PieChartOutlined,
  },
  {
    key: "/liabilities",
    label: "Liabilities",
    icon: CreditCardOutlined,
  },
  {
    key: "/cashflow",
    label: "Cashflow",
    icon: RiseOutlined,
  },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = `/${location.pathname.split("/")[1] || ""}`.replace(/\/$/, "") || "/";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        background: "rgba(17, 20, 26, 0.94)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid #21262D",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "0 8px env(safe-area-inset-bottom, 0px)",
        zIndex: 1000,
        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.4)",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = currentPath === item.key;
        const IconComponent = item.icon;

        return (
          <button
            key={item.key}
            onClick={() => navigate(item.key)}
            style={{
              background: "transparent",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              flex: 1,
              padding: "6px 0",
              cursor: "pointer",
              color: isActive ? "#38BDF8" : "#8B949E",
              transition: "all 0.2s ease",
            }}
          >
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconComponent
                style={{
                  fontSize: 20,
                  color: isActive ? "#38BDF8" : "#8B949E",
                  filter: isActive ? "drop-shadow(0 0 8px rgba(56, 189, 248, 0.5))" : "none",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "#38BDF8" : "#8B949E",
                letterSpacing: "0.2px",
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
