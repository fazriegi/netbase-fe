import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, theme, App as AntdApp } from "antd";
import { DashboardProvider } from "./context/DashboardContext";

const commonInputTokens = {
  colorBgContainer: "#0E0F12",
  colorBorder: "#23262E",
  activeBorderColor: "#2563eb",
  hoverBorderColor: "#3b82f6",
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        algorithm: [theme.darkAlgorithm, theme.compactAlgorithm],
        token: {
          // --- Base Colors ---
          colorBgBase: "#0E0F12",
          colorBgContainer: "#15171C",
          colorBgElevated: "#1E2128",

          // --- Brand & Functional Colors ---
          colorPrimary: "#2563eb",
          colorSuccess: "#10B981",
          colorError: "#EF4444",
          colorWarning: "#F59E0B",
          colorInfo: "#3B82F6",

          // --- Typography & Borders ---
          colorTextBase: "#EDEEF0",
          colorTextSecondary: "#9AA0AA",
          colorBorder: "#23262E",
          colorBorderSecondary: "#1A1D24",

          // --- Global Shape ---
          borderRadius: 8,
          fontFamily:
            "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        },

        components: {
          Layout: {
            bodyBg: "#0E0F12",
            siderBg: "#0E0F12",
            headerBg: "#0E0F12",
          },

          Menu: {
            darkItemBg: "transparent",
            darkItemHoverBg: "#15171C",
            darkItemSelectedBg: "#1A1D24",
            darkItemSelectedColor: "#2563eb",
          },

          Button: {
            primaryShadow: "none",
            defaultBg: "#15171C",
            defaultBorderColor: "#23262E",
            defaultColor: "#EDEEF0",
            controlHeight: 38,
          },

          Card: {
            colorBgContainer: "#15171C",
            colorBorderSecondary: "#23262E",
            borderRadiusLG: 12,
            headerBg: "transparent",
          },

          Table: {
            colorBgContainer: "#15171C",
            headerBg: "#1A1D24",
            headerColor: "#9AA0AA",
            borderColor: "#23262E",
            rowHoverBg: "#1A1D24",
          },

          Modal: {
            contentBg: "#15171C",
            headerBg: "#15171C",
          },

          // ==========================================
          // AREA SEMUA JENIS INPUT
          // ==========================================
          Checkbox: {
            colorBorder: "#767676ff",
            borderRadiusSM: 4,
          },
          Input: {
            ...commonInputTokens,
          },
          InputNumber: {
            ...commonInputTokens,
          },
          Select: {
            ...commonInputTokens,
            optionSelectedBg: "#1A1D24",
          },
          DatePicker: {
            ...commonInputTokens,
          },
          TimePicker: {
            ...commonInputTokens,
          },
          Cascader: {
            ...commonInputTokens,
          },
          TreeSelect: {
            ...commonInputTokens,
          },
          Mentions: {
            ...commonInputTokens,
          },
          AutoComplete: {
            ...commonInputTokens,
          },
        },
      }}
    >
      <AntdApp>
        <BrowserRouter>
          <DashboardProvider>
            <App />
          </DashboardProvider>
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  </StrictMode>,
);
