import React from "react";
import { Card, Grid, Tooltip } from "antd";
import { formatRupiah } from "src/pkg/helper";
import { useDashboard } from "src/context/DashboardContext";

export default function CashflowCard({ data: dataProp, cashflowData, loading = false }) {
  const { isPrivacyMode } = useDashboard();
  const screens = Grid.useBreakpoint();
  const isMobile = screens.lg === false;

  const data = dataProp || cashflowData;
  const income = Number(data?.total_inflow ?? data?.totalIncome ?? data?.total_income ?? 0);
  const expense = Number(data?.total_outflow ?? data?.totalExpense ?? data?.total_expense ?? 0);
  const rawSavingsRate = data?.savings_rate ?? data?.savingsRate ?? 0;
  const savingsRate = typeof rawSavingsRate === "number" ? rawSavingsRate : parseFloat(rawSavingsRate) || 0;
  const netFreeCashflow = Number(data?.net_free_cashflow ?? data?.netFreeCashflow ?? (income - expense));

  // Maximum value for proportional progress bar
  const maxVal = Math.max(income, expense) || 1;
  const incomePercent = income > 0 ? Math.min(100, Math.round((income / maxVal) * 100)) : 0;
  const expensePercent = expense > 0 ? Math.min(100, Math.round((expense / maxVal) * 100)) : 0;

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
          justifyContent: "space-between",
          height: "100%",
          boxSizing: "border-box",
        },
      }}
    >
      <div>
        {/* Header: Title & Savings Rate Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
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
            Monthly Cashflow
          </span>

          <div
            style={{
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#10B981",
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 20,
              letterSpacing: "0.2px",
            }}
          >
            Savings Rate: {typeof savingsRate === "number" ? (savingsRate % 1 === 0 ? savingsRate : Number(savingsRate.toFixed(1))) : savingsRate}%
          </div>
        </div>

        {/* Progress Bar 1: Total Income */}
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 13, color: "#8B949E", fontWeight: 500 }}>
              Total Income
            </span>
            <Tooltip
              title={isPrivacyMode ? null : formatRupiah(income, false)}
              placement="topLeft"
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#F0F6FC",
                }}
              >
                {formatRupiah(income, isPrivacyMode)}
              </span>
            </Tooltip>
          </div>

          <div
            style={{
              height: 10,
              background: "#12231F",
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${incomePercent}%`,
                background: "linear-gradient(90deg, #059669 0%, #10B981 100%)",
                borderRadius: 6,
                boxShadow: "0 0 8px rgba(16, 185, 129, 0.5)",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* Progress Bar 2: Total Expense */}
        <div style={{ marginBottom: 22 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 13, color: "#8B949E", fontWeight: 500 }}>
              Total Expense
            </span>
            <Tooltip
              title={isPrivacyMode ? null : formatRupiah(expense, false)}
              placement="topLeft"
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#F0F6FC",
                }}
              >
                {formatRupiah(expense, isPrivacyMode)}
              </span>
            </Tooltip>
          </div>

          <div
            style={{
              height: 10,
              background: "#261517",
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${expensePercent}%`,
                background: "linear-gradient(90deg, #E11D48 0%, #EF4444 100%)",
                borderRadius: 6,
                boxShadow: "0 0 8px rgba(239, 68, 68, 0.5)",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* Highlight Box: Net Free Cashflow */}
      <div
        style={{
          background: "#0D1117",
          border: "1px solid #21262D",
          borderRadius: 10,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          textAlign: "center",
        }}
      >
        <span style={{ color: "#8B949E", fontSize: 13, fontWeight: 500 }}>
          Net Free Cashflow:
        </span>
        <span
          style={{
            color: netFreeCashflow >= 0 ? "#10B981" : "#EF4444",
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: "0.2px",
          }}
        >
          {formatRupiah(netFreeCashflow, isPrivacyMode, true)}
        </span>
      </div>
    </Card>
  );
}
