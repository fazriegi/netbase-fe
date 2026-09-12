import React, { useState, useMemo, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Select,
  Button,
  Typography,
  Divider,
  App as AntdApp,
  Tag,
  Avatar,
  Grid,
  Space,
} from "antd";
import {
  CalendarOutlined,
  SaveOutlined,
  UserOutlined,
  InfoCircleOutlined,
  MailOutlined,
  WalletOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "src/pkg/api";
import { useDashboard } from "src/context/DashboardContext";
import { getFinancialMonthRange, getOrdinalSuffix } from "src/pkg/helper/date";

const { Title, Text, Paragraph } = Typography;

export default function SettingsPage() {
  const { message } = AntdApp.useApp();
  const screens = Grid.useBreakpoint();
  const isMobile = screens.sm === false;

  const { cycleStartDay, updateCycleStartDay } = useDashboard();

  const [selectedDay, setSelectedDay] = useState(cycleStartDay || 1);
  const [saving, setSaving] = useState(false);

  // Profile data from localStorage with fresh API sync
  const [profileData, setProfileData] = useState(() => {
    return JSON.parse(localStorage.getItem("USER") || "{}");
  });

  useEffect(() => {
    setSelectedDay(cycleStartDay || 1);
  }, [cycleStartDay]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/v1/profile");
        const data = res?.data?.data || res?.data;
        if (data) {
          setProfileData((prev) => ({ ...prev, ...data }));
          const stored = JSON.parse(localStorage.getItem("USER") || "{}");
          localStorage.setItem("USER", JSON.stringify({ ...stored, ...data }));
        }
      } catch (err) {
        console.warn("Could not fetch profile from server:", err?.message);
      }
    };
    fetchProfile();
  }, []);

  const displayName = profileData?.full_name || profileData?.name || "User";
  const displayUsername = profileData?.username ? `@${profileData.username}` : "";
  const displayEmail = profileData?.email || "";
  const initial = (displayName?.[0] || "U").toUpperCase();
  const memberSince = profileData?.created_at
    ? dayjs(profileData.created_at).format("D MMMM YYYY")
    : null;

  // Live preview based on current reference date and selectedDay
  const previewRange = useMemo(() => {
    return getFinancialMonthRange(selectedDay, dayjs());
  }, [selectedDay]);

  const handleSaveCycle = async () => {
    setSaving(true);
    try {
      await updateCycleStartDay(selectedDay);
      message.success("Financial cycle settings saved successfully!");
    } catch (err) {
      const apiMsg = err?.response?.data?.message || "Failed to save settings";
      message.error(apiMsg);
    } finally {
      setSaving(false);
    }
  };

  const dayOptions = useMemo(() => {
    return Array.from({ length: 31 }, (_, i) => {
      const day = i + 1;
      let label = `${getOrdinalSuffix(day)} of month`;
      return { label, value: day };
    });
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", paddingBottom: 40 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ color: "#F0F6FC", margin: 0, fontWeight: 700 }}>
          Account Settings
        </Title>
        <Text style={{ color: "#8B949E", fontSize: 14 }}>
          Manage your account.
        </Text>
      </div>

      <Row gutter={[20, 20]}>
        {/* Card 1 (Top): User Profile */}
        <Col xs={24}>
          <Card
            variant="borderless"
            style={{
              background: "#161B22",
              border: "1px solid #21262D",
              borderRadius: 14,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
            }}
            styles={{ body: { padding: isMobile ? 16 : 24 } }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "rgba(56, 189, 248, 0.12)",
                  color: "#38BDF8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                <UserOutlined />
              </div>
              <div>
                <Title level={4} style={{ color: "#F0F6FC", margin: 0, fontSize: 16, fontWeight: 700 }}>
                  User Profile
                </Title>
                <Text style={{ color: "#8B949E", fontSize: 13 }}>
                  Your personal account information
                </Text>
              </div>
            </div>

            <Divider style={{ borderColor: "#21262D", margin: "16px 0" }} />

            {/* Profile Overview (Avatar & Name) */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <Avatar
                size={58}
                style={{
                  backgroundColor: "#2563EB",
                  color: "#FFFFFF",
                  fontWeight: "bold",
                  fontSize: 22,
                  boxShadow: "0 0 14px rgba(37, 99, 235, 0.45)",
                }}
              >
                {initial}
              </Avatar>
              <div>
                <Text strong style={{ color: "#F0F6FC", fontSize: 18, display: "block", lineHeight: 1.3 }}>
                  {displayName}
                </Text>
                <Space size={8} wrap>
                  {displayUsername && (
                    <Text style={{ color: "#8B949E", fontSize: 13 }}>
                      {displayUsername}
                    </Text>
                  )}
                  {memberSince && (
                    <Text style={{ color: "#6E7681", fontSize: 13 }}>
                      • Joined {memberSince}
                    </Text>
                  )}
                </Space>
              </div>
            </div>

            {/* Information Grid: Email, Username, Currency */}
            <Row gutter={[16, 16]}>
              {/* Email Address */}
              <Col xs={24} sm={12}>
                <div
                  style={{
                    background: "#0D1117",
                    border: "1px solid #21262D",
                    borderRadius: 10,
                    padding: "14px 16px",
                    height: "100%",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <MailOutlined style={{ color: "#38BDF8", fontSize: 15 }} />
                    <Text style={{ color: "#8B949E", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Email Address
                    </Text>
                  </div>
                  <Text strong style={{ color: "#F0F6FC", fontSize: 14, wordBreak: "break-all", display: "block" }}>
                    {displayEmail || "No email registered"}
                  </Text>
                </div>
              </Col>

              {/* Username */}
              <Col xs={24} sm={12}>
                <div
                  style={{
                    background: "#0D1117",
                    border: "1px solid #21262D",
                    borderRadius: 10,
                    padding: "14px 16px",
                    height: "100%",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <IdcardOutlined style={{ color: "#10B981", fontSize: 15 }} />
                    <Text style={{ color: "#8B949E", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Username
                    </Text>
                  </div>
                  <Text strong style={{ color: "#F0F6FC", fontSize: 14 }}>
                    {displayUsername || "-"}
                  </Text>
                </div>
              </Col>

              {/* Primary Currency */}
              <Col xs={24}>
                <div
                  style={{
                    background: "#0D1117",
                    border: "1px solid #21262D",
                    borderRadius: 10,
                    padding: "12px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <WalletOutlined style={{ color: "#F59E0B", fontSize: 15 }} />
                    <Text style={{ color: "#8B949E", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Primary Currency
                    </Text>
                  </div>
                  <Tag color="cyan" style={{ margin: 0, fontWeight: 700 }}>
                    IDR (Rp)
                  </Tag>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>


        {/* Card 2: Financial Month Cycle / Payday */}
        <Col xs={24}>
          <Card
            variant="borderless"
            style={{
              background: "#161B22",
              border: "1px solid #21262D",
              borderRadius: 14,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
            }}
            styles={{ body: { padding: isMobile ? 16 : 24 } }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "rgba(56, 189, 248, 0.12)",
                  color: "#38BDF8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                <CalendarOutlined />
              </div>
              <div style={{ flex: 1 }}>
                <Title level={4} style={{ color: "#F0F6FC", margin: 0, fontSize: 16, fontWeight: 700 }}>
                  Financial Month Start Day (Payday Cycle)
                </Title>
                <Paragraph style={{ color: "#8B949E", fontSize: 13, marginTop: 4, marginBottom: 0 }}>
                  Set the start date of your monthly cashflow cycle. The dashboard and monthly transaction views will automatically align with this billing cycle.
                </Paragraph>
              </div>
            </div>

            <Divider style={{ borderColor: "#21262D", margin: "16px 0" }} />

            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 16, alignItems: isMobile ? "stretch" : "center", marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <Text style={{ color: "#C9D1D9", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Select Cycle Start Date:
                </Text>
                <Select
                  value={selectedDay}
                  onChange={(val) => setSelectedDay(val)}
                  options={dayOptions}
                  style={{ width: "100%", maxWidth: isMobile ? "100%" : 320 }}
                  popupMatchSelectWidth={false}
                />
              </div>

              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={saving}
                disabled={selectedDay === cycleStartDay}
                onClick={handleSaveCycle}
                style={{
                  height: 40,
                  padding: "0 24px",
                  borderRadius: 8,
                  alignSelf: isMobile ? "stretch" : "flex-end",
                  background: selectedDay === cycleStartDay ? undefined : "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                }}
              >
                Save Changes
              </Button>
            </div>

            {/* Live Preview Box */}
            <div
              style={{
                background: "#0D1117",
                border: "1px solid #30363D",
                borderRadius: 10,
                padding: "14px 18px",
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "flex-start" : "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <InfoCircleOutlined style={{ color: "#38BDF8", fontSize: 16 }} />
                <div>
                  <Text style={{ color: "#8B949E", fontSize: 12, display: "block" }}>
                    Current Active Cycle ({dayjs().format("MMMM YYYY")}):
                  </Text>
                  <Text strong style={{ color: "#F0F6FC", fontSize: 14 }}>
                    {previewRange.label}
                  </Text>
                </div>
              </div>

              <Tag
                color={selectedDay > 1 ? "blue" : "default"}
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                {selectedDay > 1 ? `Every ${getOrdinalSuffix(selectedDay)} of month` : "Standard Calendar (1st - End)"}
              </Tag>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
