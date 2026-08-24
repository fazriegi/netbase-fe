import React from "react";
import {
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Dropdown, Space, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { handleLogout } from "src/pkg/global/auth";

const { Text } = Typography;

export default function UserDropdown() {
  const navigate = useNavigate();

  const storedUser = JSON.parse(localStorage.getItem("USER") || "null");
  const user = storedUser || {};

  const items = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profile",
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Settings",
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      danger: true,
    },
  ];

  const displayName = user?.full_name || user?.name || "egi";
  const displayUsername = user?.username ? `@${user.username}` : "@egi";
  const initial = (displayName?.[0] || "E").toUpperCase();

  return (
    <Dropdown
      menu={{
        items,
        onClick: ({ key }) => {
          if (key === "logout") {
            handleLogout();
          }
          if (key === "settings" || key === "profile") {
            navigate("/settings");
          }
        },
      }}
      placement="bottomRight"
      trigger={["click"]}
    >
      <Space
        style={{
          cursor: "pointer",
          padding: "4px 8px",
          borderRadius: 8,
          transition: "background 0.2s",
        }}
        className="user-dropdown-hover"
      >
        <Avatar
          size={32}
          style={{
            backgroundColor: "#2563EB",
            color: "#FFFFFF",
            fontWeight: "bold",
            fontSize: 14,
            boxShadow: "0 0 10px rgba(37, 99, 235, 0.4)",
          }}
        >
          {initial}
        </Avatar>

        <div style={{ lineHeight: 1.2, textAlign: "left" }}>
          <Text strong style={{ color: "#F0F6FC", fontSize: 13, display: "block" }}>
            {displayName}
          </Text>
          <Text style={{ fontSize: 11, color: "#8B949E", display: "block" }}>
            {displayUsername}
          </Text>
        </div>
      </Space>
    </Dropdown>
  );
}
