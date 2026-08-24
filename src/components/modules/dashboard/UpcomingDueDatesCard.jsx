import React, { useState, useEffect } from "react";
import { Card, Grid, Tooltip, App as AntdApp } from "antd";
import { CheckCircleOutlined, CheckCircleFilled } from "@ant-design/icons";
import { useDashboard } from "src/context/DashboardContext";
import { formatRupiah } from "src/pkg/helper";

export default function UpcomingDueDatesCard({
  dueDatesData,
  loading = false,
}) {
  const { message } = AntdApp.useApp();
  const { isPrivacyMode } = useDashboard();
  const screens = Grid.useBreakpoint();
  const isMobile = screens.lg === false;

  const [bills, setBills] = useState(dueDatesData || []);

  useEffect(() => {
    if (dueDatesData) {
      setBills(dueDatesData);
    }
  }, [dueDatesData]);

  const togglePaid = (id) => {
    setBills((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newPaid = !item.isPaid;
          if (newPaid) {
            message.success(`Bill for ${item.provider} marked as paid!`);
          } else {
            message.info(`Bill for ${item.provider} marked as unpaid.`);
          }
          return { ...item, isPaid: newPaid };
        }
        return item;
      })
    );
  };

  const activeBills = bills?.filter((b) => !b?.isPaid);
  const activeCount = activeBills?.length;

  return (
    <Card
      loading={loading}
      variant="borderless"
      style={{
        background: "#161B22",
        border: "1px solid #21262D",
        borderRadius: 14,
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.25)",
        height: "100%",
      }}
      styles={{
        body: {
          padding: isMobile ? "16px" : "20px 24px",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          boxSizing: "border-box",
        },
      }}
    >
      {/* Header: Title & Active Count Tag */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontSize: isMobile ? 15 : 17,
            fontWeight: 700,
            color: "#F0F6FC",
            letterSpacing: "-0.2px",
          }}
        >
          Upcoming Due Dates
        </span>

        <div
          style={{
            background: "#21262D",
            color: "#8B949E",
            fontSize: 11,
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: 20,
            letterSpacing: "0.2px",
          }}
        >
          {activeCount} Active {activeCount === 1 ? "Bill" : "Bills"}
        </div>
      </div>

      {/* Column Headers */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 11,
          color: "#6E7681",
          fontWeight: 500,
          padding: "4px 0 8px 0",
          borderBottom: "1px solid #21262D",
          marginBottom: 8,
        }}
      >
        <div style={{ flex: 1.2, paddingLeft: 4 }}>Bill</div>
        <div style={{ flex: 1.2, textAlign: "center" }}>Due Date</div>
        <div style={{ flex: 1, textAlign: "right", paddingRight: 4 }}>Amount</div>
      </div>

      {/* List of Bills */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, justifyContent: "center" }}>
        {bills?.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "24px 0",
              color: "#8B949E",
              fontSize: 13,
            }}
          >
            No upcoming bills 🎉
          </div>
        ) : (
          bills?.map((bill) => {
            const isWarning = bill?.badgeType === "warning" || bill?.dueInDays <= 3;
            const badgeBg = isWarning ? "rgba(245, 158, 11, 0.15)" : "rgba(139, 148, 158, 0.15)";
            const badgeColor = isWarning ? "#F59E0B" : "#8B949E";
            const badgeBorder = isWarning ? "rgba(245, 158, 11, 0.3)" : "rgba(139, 148, 158, 0.25)";

            return (
              <div
                key={bill?.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: isMobile ? "10px 8px" : "12px 12px",
                  borderRadius: 10,
                  background: bill?.isPaid ? "rgba(22, 27, 34, 0.4)" : "#1B2028",
                  border: bill?.isPaid ? "1px solid #21262D" : "1px solid #2D333B",
                  opacity: bill?.isPaid ? 0.6 : 1,
                  transition: "all 0.25s ease",
                }}
              >
                {/* Left: Bill Name & Category */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    flex: 1.2,
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: isMobile ? 13 : 14,
                      fontWeight: 600,
                      color: bill?.isPaid ? "#8B949E" : "#F0F6FC",
                      textDecoration: bill?.isPaid ? "line-through" : "none",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {bill?.provider}
                  </span>
                  {bill?.category && (
                    <span
                      style={{
                        fontSize: 10,
                        color: "#8B949E",
                      }}
                    >
                      {bill?.category}
                    </span>
                  )}
                </div>

                {/* Center: Due Date Label & Badge */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    flex: 1.2,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 10,
                        color: "#6E7681",
                        lineHeight: 1,
                        marginBottom: 2,
                      }}
                    >
                      Due date
                    </div>
                    <div
                      style={{
                        fontSize: isMobile ? 11 : 12,
                        color: "#C9D1D9",
                        fontWeight: 600,
                      }}
                    >
                      {bill?.dueDateLabel.replace(/^(Jatuh tempo |Due )/i, "")}
                    </div>
                  </div>

                  <div
                    style={{
                      background: badgeBg,
                      color: badgeColor,
                      border: `1px solid ${badgeBorder}`,
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: 6,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {bill?.dueBadge}
                  </div>
                </div>

                {/* Right: Nominal & Mark as Paid Action Button */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 8,
                    flex: 1,
                  }}
                >
                  <Tooltip
                    title={isPrivacyMode ? null : formatRupiah(bill?.amount, false)}
                    placement="topLeft"
                  >
                    <span
                      style={{
                        fontSize: isMobile ? 12 : 13,
                        fontWeight: 700,
                        color: bill?.isPaid ? "#8B949E" : "#F0F6FC",
                        textDecoration: bill?.isPaid ? "line-through" : "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatRupiah(bill?.amount, isPrivacyMode)}
                    </span>
                  </Tooltip>

                  <Tooltip title={bill?.isPaid ? "Mark as unpaid" : "Mark as paid"}>
                    <button
                      onClick={() => togglePaid(bill?.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: bill?.isPaid ? "#10B981" : "#6E7681",
                        fontSize: 18,
                        transition: "all 0.2s",
                      }}
                    >
                      {bill?.isPaid ? <CheckCircleFilled /> : <CheckCircleOutlined />}
                    </button>
                  </Tooltip>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
