import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, Segmented, Grid, Spin } from "antd";
import { DownOutlined, UpOutlined, PieChartOutlined } from "@ant-design/icons";
import { PieChart, Pie, Sector, ResponsiveContainer } from "recharts";
import api from "src/pkg/api";
import { formatRupiah } from "src/pkg/helper";
import { useDashboard } from "src/context/DashboardContext";

const EXPENSE_PALETTE = [
  "#F43F5E", // Rose
  "#F59E0B", // Amber
  "#3B82F6", // Blue
  "#A855F7", // Purple
  "#06B6D4", // Cyan
  "#EC4899", // Pink
  "#F97316", // Orange
  "#6366F1", // Indigo
  "#14B8A6", // Teal
  "#EAB308", // Yellow
];

const INCOME_PALETTE = [
  "#10B981", // Emerald
  "#38BDF8", // Sky
  "#8B5CF6", // Violet
  "#F59E0B", // Amber
  "#14B8A6", // Teal
  "#3B82F6", // Blue
  "#EC4899", // Pink
  "#84CC16", // Lime
];

const REMAINING_COLOR = "#10B981";
const OTHERS_COLOR = "#64748B";
const MAX_VISIBLE_SLICES = 6;

function formatBadgePercent(pct) {
  if (!pct || pct <= 0) return "0%";
  if (pct < 1) return "<1%";
  if (pct >= 99.5 && pct < 100) return "99%";
  return `${Math.round(pct)}%`;
}

export default function CashflowAllocationCard({
  periodParams = {},
  refreshTrigger = 0,
}) {
  const { isPrivacyMode } = useDashboard();
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;

  const [mode, setMode] = useState("all"); // "all" | "income" | "expense"
  const [showAllRows, setShowAllRows] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allocationData, setAllocationData] = useState({
    income: 0,
    expense: 0,
    net: 0,
    income_categories: [],
    expense_categories: [],
  });

  // Hover (desktop only) & pinned selection key for interactive donut readout
  const [hoveredKey, setHoveredKey] = useState(null);
  const [pinnedKey, setPinnedKey] = useState(null);

  const activeKey = !isMobile && hoveredKey !== null ? hoveredKey : pinnedKey;
  const periodKey = JSON.stringify(periodParams || {});

  // Reset active selection & expansion when switching mode or period
  useEffect(() => {
    setHoveredKey(null);
    setPinnedKey(null);
    setShowAllRows(false);
  }, [mode, periodKey]);

  const fetchAllocation = useCallback(async () => {
    setLoading(true);
    try {
      const parsedParams = JSON.parse(periodKey);
      const res = await api.get("/v1/transactions/allocation", {
        params: parsedParams,
      });

      const payload = res?.data?.data || {};
      const income = Number(payload.income) || 0;
      const expense = Number(payload.expense) || 0;

      setAllocationData({
        income,
        expense,
        net: payload.net !== undefined ? Number(payload.net) || 0 : income - expense,
        income_categories: Array.isArray(payload.income_categories)
          ? payload.income_categories
          : [],
        expense_categories: Array.isArray(payload.expense_categories)
          ? payload.expense_categories
          : [],
      });
    } catch (err) {
      console.error("Failed to fetch cashflow allocation:", err);
      setAllocationData({
        income: 0,
        expense: 0,
        net: 0,
        income_categories: [],
        expense_categories: [],
      });
    } finally {
      setLoading(false);
    }
  }, [periodKey]);

  useEffect(() => {
    fetchAllocation();
  }, [fetchAllocation, refreshTrigger]);

  // Normalize & colorize backend allocation categories
  const aggregated = useMemo(() => {
    const incomeItems = (allocationData.income_categories || [])
      .map((cat) => ({
        key: `inc-${cat.id ?? cat.name}`,
        name: cat.name || "Uncategorized Income",
        value: Number(cat.amount) || 0,
        count: Number(cat.count) || 0,
        type: "income",
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .map((item, idx) => {
        const color = INCOME_PALETTE[idx % INCOME_PALETTE.length];
        return {
          ...item,
          color,
          fill: color,
        };
      });

    const expenseItems = (allocationData.expense_categories || [])
      .map((cat) => ({
        key: `exp-${cat.id ?? cat.name}`,
        name: cat.name || "Uncategorized Expense",
        value: Number(cat.amount) || 0,
        count: Number(cat.count) || 0,
        type: "expense",
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .map((item, idx) => {
        const color = EXPENSE_PALETTE[idx % EXPENSE_PALETTE.length];
        return {
          ...item,
          color,
          fill: color,
        };
      });

    const totalIncome = Number(allocationData.income) || 0;
    const totalExpense = Number(allocationData.expense) || 0;

    return {
      totalIncome,
      totalExpense,
      netCashflow: totalIncome - totalExpense,
      incomeItems,
      expenseItems,
    };
  }, [allocationData]);

  // Build chart data & center summary according to selected mode
  const chartConfig = useMemo(() => {
    const { totalIncome, totalExpense, netCashflow, incomeItems, expenseItems } = aggregated;

    if (mode === "income") {
      const allItems = incomeItems.map((it) => ({
        ...it,
        percent: totalIncome > 0 ? (it.value / totalIncome) * 100 : 0,
      }));
      return {
        subtitle: "Income breakdown by category",
        allItems,
        denominator: totalIncome,
        denominatorLabel: "Income",
        centerTitle: "Total Income",
        centerValue: formatRupiah(totalIncome, isPrivacyMode),
        centerSub: `${incomeItems.length} ${incomeItems.length === 1 ? "Category" : "Categories"}`,
        centerSubColor: "#10B981",
        deficitBanner: null,
        emptyText: "No income recorded in this period",
      };
    }

    if (mode === "expense") {
      const allItems = expenseItems.map((it) => ({
        ...it,
        percent: totalExpense > 0 ? (it.value / totalExpense) * 100 : 0,
      }));
      return {
        subtitle: "Expense breakdown by category",
        allItems,
        denominator: totalExpense,
        denominatorLabel: "Expense",
        centerTitle: "Total Expense",
        centerValue: formatRupiah(totalExpense, isPrivacyMode),
        centerSub: `${expenseItems.length} ${expenseItems.length === 1 ? "Category" : "Categories"}`,
        centerSubColor: "#F43F5E",
        deficitBanner: null,
        emptyText: "No expenses recorded in this period",
      };
    }

    // Mode === "all" (Cycle Cashflow Allocation: Income -> Expenses + Remaining Cashflow)
    if (totalIncome === 0 && totalExpense === 0) {
      return {
        subtitle: "How cycle income is allocated across expenses & remaining cashflow",
        allItems: [],
        denominator: 0,
        denominatorLabel: "Income",
        centerTitle: "No Cashflow",
        centerValue: formatRupiah(0, isPrivacyMode),
        centerSub: "0 Transactions",
        centerSubColor: "#8B949E",
        deficitBanner: null,
        emptyText: "No transactions recorded in this period",
      };
    }

    // Surplus or exact break-even with positive income: 100% = Total Income
    if (totalIncome > 0 && netCashflow >= 0) {
      const combined = [...expenseItems];
      if (netCashflow > 0) {
        combined.push({
          key: "remaining-cashflow",
          name: "Remaining Cashflow",
          value: netCashflow,
          count: null,
          type: "remaining",
          isRemaining: true,
          color: REMAINING_COLOR,
          fill: REMAINING_COLOR,
        });
      }

      combined.sort((a, b) => b.value - a.value);

      const allItems = combined.map((it) => ({
        ...it,
        percent: (it.value / totalIncome) * 100,
      }));

      const savingsPct = (netCashflow / totalIncome) * 100;
      const formattedSavingsPct =
        savingsPct % 1 === 0 ? `${savingsPct}%` : `${savingsPct.toFixed(1)}%`;

      return {
        subtitle: "How 100% of your income is allocated across expenses & savings",
        allItems,
        denominator: totalIncome,
        denominatorLabel: "Income",
        centerTitle: "Total Income",
        centerValue: formatRupiah(totalIncome, isPrivacyMode),
        centerSub: `${formattedSavingsPct} Remaining`,
        centerSubColor: netCashflow > 0 ? "#10B981" : "#8B949E",
        deficitBanner: null,
        emptyText: "No transactions recorded in this period",
      };
    }

    // Deficit (Expense > Income) or Expense-only (Income === 0)
    const allItems = expenseItems.map((it) => ({
      ...it,
      percent: totalExpense > 0 ? (it.value / totalExpense) * 100 : 0,
    }));

    if (totalIncome > 0) {
      const overPct = Math.round(((totalExpense - totalIncome) / totalIncome) * 100);
      return {
        subtitle: "Expenses exceeded income — showing expense share & cycle deficit",
        allItems,
        denominator: totalExpense,
        denominatorLabel: "Expense",
        centerTitle: "Deficit Cashflow",
        centerValue: formatRupiah(netCashflow, isPrivacyMode, false),
        centerSub: `${overPct}% Over Income`,
        centerSubColor: "#EF4444",
        deficitBanner: {
          income: totalIncome,
          expense: totalExpense,
          deficit: netCashflow,
        },
        emptyText: "No transactions recorded in this period",
      };
    }

    return {
      subtitle: "No income recorded yet — showing expense breakdown",
      allItems,
      denominator: totalExpense,
      denominatorLabel: "Expense",
      centerTitle: "Total Expense",
      centerValue: formatRupiah(totalExpense, isPrivacyMode),
      centerSub: "No Income Recorded",
      centerSubColor: "#F59E0B",
      deficitBanner: null,
      emptyText: "No transactions recorded in this period",
    };
  }, [mode, aggregated, isPrivacyMode]);

  // Group tail slices (> MAX_VISIBLE_SLICES) into a clean "Others" slice on the Donut ring
  // so tiny <1% items don't render as jagged slivers
  const { pieItems, collapsedListItems, hiddenCount } = useMemo(() => {
    const { allItems, denominator } = chartConfig;
    if (allItems.length <= MAX_VISIBLE_SLICES) {
      return {
        pieItems: allItems,
        collapsedListItems: allItems,
        hiddenCount: 0,
      };
    }

    const remainingItem = allItems.find((it) => it.isRemaining);
    const categoryOnlyItems = remainingItem
      ? allItems.filter((it) => !it.isRemaining)
      : allItems;

    const maxCategoryHead = remainingItem ? MAX_VISIBLE_SLICES - 2 : MAX_VISIBLE_SLICES - 1;
    const headCategories = categoryOnlyItems.slice(0, maxCategoryHead);
    const tailCategories = categoryOnlyItems.slice(maxCategoryHead);

    if (tailCategories.length <= 1) {
      return {
        pieItems: allItems,
        collapsedListItems: allItems,
        hiddenCount: 0,
      };
    }

    const tailSum = tailCategories.reduce((sum, item) => sum + item.value, 0);
    const tailTxCount = tailCategories.reduce((sum, item) => sum + (item.count || 0), 0);

    const othersSlice = {
      key: "others-grouped",
      name: `Others (${tailCategories.length})`,
      value: tailSum,
      count: tailTxCount || null,
      type: tailCategories[0]?.type || "expense",
      isOthersGroup: true,
      childKeys: new Set(tailCategories.map((t) => t.key)),
      color: OTHERS_COLOR,
      fill: OTHERS_COLOR,
      percent: denominator > 0 ? (tailSum / denominator) * 100 : 0,
    };

    const grouped = remainingItem
      ? [...headCategories, remainingItem, othersSlice].sort((a, b) => b.value - a.value)
      : [...headCategories, othersSlice];

    return {
      pieItems: grouped,
      collapsedListItems: grouped,
      hiddenCount: tailCategories.length,
    };
  }, [chartConfig]);

  const displayedListItems = showAllRows ? chartConfig.allItems : collapsedListItems;

  // Resolve active item from either full list or grouped slice
  const activeItem = useMemo(() => {
    if (!activeKey) return null;
    const exactMatch = chartConfig.allItems.find((it) => it.key === activeKey);
    if (exactMatch) return exactMatch;
    return pieItems.find((it) => it.key === activeKey) || null;
  }, [activeKey, chartConfig.allItems, pieItems]);

  const handleTogglePin = (key) => {
    setPinnedKey((prev) => (prev === key ? null : key));
  };

  const isPieSliceHighlighted = (slice) => {
    if (!activeKey) return false;
    if (slice.key === activeKey) return true;
    if (slice.isOthersGroup && slice.childKeys?.has(activeKey)) return true;
    return false;
  };

  const renderSectorShape = (sectorProps) => {
    const slice = sectorProps.payload;
    const isHighlighted = slice ? isPieSliceHighlighted(slice) : false;
    const hasSelection = activeKey !== null;

    return (
      <Sector
        {...sectorProps}
        fill={slice?.color || sectorProps.fill}
        outerRadius={
          isHighlighted ? (sectorProps.outerRadius || 84) + 5 : sectorProps.outerRadius
        }
        fillOpacity={hasSelection && !isHighlighted ? 0.32 : 1}
        stroke="none"
        style={{
          cursor: "pointer",
          outline: "none",
          WebkitTapHighlightColor: "transparent",
          transition: "fill-opacity 0.2s ease",
        }}
      />
    );
  };

  const donutSize = isMobile ? 186 : 228;
  const innerRadius = isMobile ? 63 : 74;
  const outerRadius = isMobile ? 84 : 98;

  const centerDisplayValue = activeItem
    ? formatRupiah(
        activeItem.value,
        isPrivacyMode,
        Boolean(activeItem.isRemaining || activeItem.type === "income")
      )
    : chartConfig.centerValue;

  const centerValueFontSize = useMemo(() => {
    const len = (centerDisplayValue || "").length;
    if (isMobile) {
      return len > 13 ? 11.5 : 13;
    }
    return len > 15 ? 12.5 : 14;
  }, [centerDisplayValue, isMobile]);

  return (
    <Card
      variant="borderless"
      style={{
        background: "#161B22",
        border: "1px solid #21262D",
        borderRadius: 14,
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
        marginBottom: isMobile ? 12 : 16,
      }}
      styles={{
        body: {
          padding: isMobile ? "12px 14px" : "18px 22px",
        },
      }}
    >
      {/* Header Row */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center",
          justifyContent: "space-between",
          gap: isMobile ? 8 : 12,
        }}
      >
        {/* Title & Subtitle */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <PieChartOutlined style={{ color: "#38BDF8", fontSize: 15 }} />
            <span
              style={{
                fontSize: isMobile ? 14 : 16,
                fontWeight: 700,
                color: "#F0F6FC",
                letterSpacing: "-0.2px",
              }}
            >
              Cashflow Allocation
            </span>
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#8B949E",
              marginTop: 3,
            }}
          >
            {chartConfig.subtitle}
          </div>
        </div>

        {/* Mode Switcher */}
        <Segmented
          block={isMobile}
          options={[
            { label: "All", value: "all" },
            { label: "Income", value: "income" },
            { label: "Expense", value: "expense" },
          ]}
          value={mode}
          onChange={(val) => setMode(val)}
          style={{
            background: "#0D1117",
            border: "1px solid #21262D",
            padding: 2,
            borderRadius: 8,
            fontSize: 12,
          }}
        />
      </div>

      {/* Main Content */}
      <Spin spinning={loading}>
          {chartConfig.allItems.length === 0 ? (
            <div
              style={{
                padding: isMobile ? "22px 12px" : "36px 16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                marginTop: 12,
                background: "#0D1117",
                border: "1px dashed #21262D",
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  border: "7px solid #21262D",
                  marginBottom: 10,
                }}
              />
              <div style={{ color: "#F0F6FC", fontSize: 13, fontWeight: 600 }}>
                {chartConfig.emptyText}
              </div>
              <div style={{ color: "#8B949E", fontSize: 12, marginTop: 4 }}>
                Add income or expense transactions to visualize your allocation.
              </div>
            </div>
          ) : (
            <div
              style={{
                marginTop: isMobile ? 12 : 18,
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: "center",
                gap: isMobile ? 12 : 28,
              }}
            >
              {/* Left / Top: Donut Ring with Interactive Center Readout */}
              <div
                style={{
                  width: isMobile ? "100%" : 244,
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <div
                  style={{
                    width: donutSize,
                    height: donutSize,
                    position: "relative",
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieItems}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={innerRadius}
                        outerRadius={outerRadius}
                        startAngle={90}
                        endAngle={-270}
                        paddingAngle={pieItems.length > 1 ? 1.5 : 0}
                        minAngle={2}
                        cornerRadius={3}
                        isAnimationActive={false}
                        shape={renderSectorShape}
                        onMouseEnter={
                          !isMobile
                            ? (entry, idx) =>
                                setHoveredKey(
                                  entry?.key ?? entry?.payload?.key ?? pieItems[idx]?.key ?? null
                                )
                            : undefined
                        }
                        onMouseLeave={!isMobile ? () => setHoveredKey(null) : undefined}
                        onClick={(entry, idx) => {
                          const targetKey =
                            entry?.key ?? entry?.payload?.key ?? pieItems[idx]?.key;
                          if (targetKey) handleTogglePin(targetKey);
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center Readout Overlay */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      pointerEvents: "none",
                      padding: "0 14px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#8B949E",
                        maxWidth: innerRadius * 1.72,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {activeItem ? activeItem.name : chartConfig.centerTitle}
                    </div>

                    <div
                      style={{
                        fontSize: centerValueFontSize,
                        fontWeight: 800,
                        color: activeItem?.isRemaining ? "#10B981" : "#F0F6FC",
                        marginTop: 2,
                        letterSpacing: "-0.3px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {centerDisplayValue}
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: activeItem ? activeItem.color : chartConfig.centerSubColor,
                        marginTop: 2,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {activeItem
                        ? `${
                            activeItem.percent < 0.1
                              ? "<0.1"
                              : activeItem.percent.toFixed(1)
                          }% of ${chartConfig.denominatorLabel}`
                        : chartConfig.centerSub}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right / Bottom: Ranked Percentage & Nominal List */}
              <div style={{ flex: 1, width: "100%", minWidth: 0 }}>
                {/* Deficit Summary Strip (only in "All" mode when Expenses > Income > 0) */}
                {chartConfig.deficitBanner && (
                  <div
                    style={{
                      background: "rgba(239, 68, 68, 0.08)",
                      border: "1px solid rgba(239, 68, 68, 0.25)",
                      borderRadius: 9,
                      padding: isMobile ? "6px 10px" : "8px 12px",
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 6,
                      fontSize: 11.5,
                    }}
                  >
                    <span style={{ color: "#8B949E" }}>
                      Income:{" "}
                      <strong style={{ color: "#10B981" }}>
                        {formatRupiah(chartConfig.deficitBanner.income, isPrivacyMode)}
                      </strong>
                    </span>
                    <span style={{ color: "#8B949E" }}>
                      Deficit:{" "}
                      <strong style={{ color: "#EF4444" }}>
                        {formatRupiah(chartConfig.deficitBanner.deficit, isPrivacyMode)}
                      </strong>
                    </span>
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: isMobile ? 5 : 6,
                    maxHeight: isMobile || showAllRows ? "none" : 264,
                    overflowY: isMobile || showAllRows ? "visible" : "auto",
                    paddingRight: isMobile || showAllRows ? 0 : 4,
                  }}
                >
                  {displayedListItems.map((item) => {
                    const isSelected = activeKey === item.key;
                    const isDimmed = activeKey !== null && !isSelected;

                    return (
                      <div
                        key={item.key}
                        onClick={() => {
                          if (item.isOthersGroup) {
                            setShowAllRows(true);
                          } else {
                            handleTogglePin(item.key);
                          }
                        }}
                        onMouseEnter={!isMobile ? () => setHoveredKey(item.key) : undefined}
                        onMouseLeave={!isMobile ? () => setHoveredKey(null) : undefined}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: isMobile ? 8 : 10,
                          padding: isMobile ? "6px 9px" : "8px 10px",
                          borderRadius: 9,
                          background: isSelected ? "#0D1117" : "rgba(13, 17, 23, 0.45)",
                          border: isSelected
                            ? `1px solid ${item.color}66`
                            : "1px solid #21262D",
                          opacity: isDimmed ? 0.5 : 1,
                          cursor: "pointer",
                          WebkitTapHighlightColor: "transparent",
                          transition: "all 0.18s ease",
                        }}
                      >
                        {/* Left: Colored % Badge + Category Name */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: isMobile ? 8 : 10,
                            minWidth: 0,
                            flex: 1,
                          }}
                        >
                          <span
                            style={{
                              background: item.color,
                              color: "#FFFFFF",
                              fontWeight: 800,
                              fontSize: 11,
                              minWidth: isMobile ? 42 : 46,
                              padding: isMobile ? "2px 5px" : "3px 6px",
                              borderRadius: 6,
                              textAlign: "center",
                              flexShrink: 0,
                              letterSpacing: "0.2px",
                            }}
                          >
                            {formatBadgePercent(item.percent)}
                          </span>

                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                fontSize: isMobile ? 12.5 : 13,
                                fontWeight: 600,
                                color: item.isRemaining ? "#10B981" : "#F0F6FC",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {item.name}
                            </div>
                            {!isMobile && item.count !== null && item.count !== undefined && (
                              <div style={{ fontSize: 11, color: "#6E7681", lineHeight: 1.2 }}>
                                {item.count} {item.count === 1 ? "transaction" : "transactions"}
                              </div>
                            )}
                            {!isMobile && item.isRemaining && (
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "#10B981",
                                  opacity: 0.8,
                                  lineHeight: 1.2,
                                }}
                              >
                                Unspent cycle income
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Nominal Amount */}
                        <div
                          style={{
                            fontSize: isMobile ? 12.5 : 13,
                            fontWeight: 700,
                            color:
                              item.isRemaining || item.type === "income"
                                ? "#10B981"
                                : "#F0F6FC",
                            flexShrink: 0,
                            textAlign: "right",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatRupiah(
                            item.value,
                            isPrivacyMode,
                            Boolean(item.isRemaining || item.type === "income")
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Expand / Collapse Tail Categories Button */}
                {hiddenCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAllRows((prev) => !prev);
                      setPinnedKey(null);
                    }}
                    style={{
                      marginTop: 6,
                      width: "100%",
                      background: "transparent",
                      border: "1px dashed #21262D",
                      borderRadius: 8,
                      padding: "5px 10px",
                      color: "#8B949E",
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 5,
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    {showAllRows ? (
                      <>
                        Show top {MAX_VISIBLE_SLICES - 1} only <UpOutlined style={{ fontSize: 10 }} />
                      </>
                    ) : (
                      <>
                        Show all {chartConfig.allItems.length} categories{" "}
                        <DownOutlined style={{ fontSize: 10 }} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </Spin>
    </Card>
  );
}
