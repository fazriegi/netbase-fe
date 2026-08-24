import React, { useState } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  HomeOutlined,
  PieChartOutlined,
  CreditCardOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import { Button, Layout, Menu, Grid, Tooltip } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import UserDropdown from "./components/container/UserDropdown";
import BottomNav from "./components/layout/BottomNav";
import { NetBaseLogo } from "./components/common/BrandLogos";
import { APP_NAME } from "./pkg/constant";
import { useDashboard } from "./context/DashboardContext";

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const MENU_ITEMS = [
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

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { isPrivacyMode, togglePrivacyMode } = useDashboard();

  const location = useLocation();
  const navigate = useNavigate();

  const screens = useBreakpoint();
  // Mobile breakpoint < 1024px (lg)
  const isMobile = screens.lg === false;

  const currentKey = `/${location.pathname.split("/")[1] || ""}`.replace(/\/$/, "") || "/";

  const brandHeader = (
    <div
      style={{
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed && !isMobile ? "center" : "flex-start",
        padding: collapsed && !isMobile ? 0 : "0 20px",
        gap: "12px",
        borderBottom: "1px solid #1E232B",
      }}
    >
      <NetBaseLogo size={32} />
      {(!collapsed || isMobile) && (
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            background: "linear-gradient(135deg, #38BDF8 0%, #2563EB 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.3px",
          }}
        >
          {APP_NAME}
        </span>
      )}
    </div>
  );

  return (
    <Layout style={{ minHeight: "100vh", background: "#0D1117" }}>
      {/* Desktop Sidebar Navigation (>= 1024px) */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={220}
          collapsedWidth={72}
          style={{
            background: "#11141A",
            borderRight: "1px solid #1E232B",
            position: "sticky",
            top: 0,
            height: "100vh",
            zIndex: 100,
          }}
        >
          {brandHeader}
          <div style={{ padding: "12px 8px" }}>
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[currentKey]}
              style={{
                background: "transparent",
                border: "none",
              }}
              items={MENU_ITEMS.map((item) => {
                const IconComp = item.icon;
                return {
                  key: item.key,
                  label: item.label,
                  icon: <IconComp style={{ fontSize: 18 }} />,
                };
              })}
              onClick={({ key }) => {
                navigate(key);
              }}
            />
          </div>
        </Sider>
      )}

      {/* Main Content Area */}
      <Layout style={{ background: "#0D1117", minHeight: "100vh" }}>
        {/* Top Header Bar */}
        <Header
          style={{
            padding: isMobile ? "0 16px" : "0 24px",
            background: "#11141A",
            borderBottom: "1px solid #1E232B",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 64,
            position: "sticky",
            top: 0,
            zIndex: 90,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Desktop Collapse Button */}
            {!isMobile && (
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  fontSize: 16,
                  color: "#8B949E",
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              />
            )}

            {/* Mobile Brand Title */}
            {isMobile && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <NetBaseLogo size={28} />
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    background: "linear-gradient(135deg, #38BDF8 0%, #2563EB 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    letterSpacing: "-0.3px",
                  }}
                >
                  {APP_NAME}
                </span>
              </div>
            )}
          </div>

          {/* Right Header Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Global Privacy Toggle */}
            <Tooltip title={isPrivacyMode ? "Show balances" : "Hide balances (Privacy Mode)"}>
              <Button
                type="text"
                shape="circle"
                icon={isPrivacyMode ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={togglePrivacyMode}
                style={{
                  color: isPrivacyMode ? "#38BDF8" : "#8B949E",
                  background: isPrivacyMode ? "rgba(56, 189, 248, 0.1)" : "rgba(255, 255, 255, 0.05)",
                  border: isPrivacyMode ? "1px solid rgba(56, 189, 248, 0.3)" : "1px solid transparent",
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
              />
            </Tooltip>

            {/* User Dropdown */}
            <UserDropdown />
          </div>
        </Header>

        {/* Content Container */}
        <Content
          style={{
            padding: isMobile ? "16px 16px 84px 16px" : "24px 32px 32px 32px",
            background: "#0D1117",
            minHeight: "calc(100vh - 64px)",
            maxWidth: 1600,
            margin: "0 auto",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <Outlet />
        </Content>

        {/* Fixed Mobile Bottom Navigation Bar (< 1024px) */}
        {isMobile && <BottomNav />}
      </Layout>
    </Layout>
  );
};

export default AppLayout;
