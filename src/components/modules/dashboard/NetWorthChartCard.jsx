import React from "react";
import { Card, Grid, Spin } from "antd";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import MilestoneTracker from "./MilestoneTracker";
import { useDashboard } from "src/context/DashboardContext";
import { formatRupiah } from "src/pkg/helper";
import moment from "moment";

const TIMEFRAMES = ["1M", "3M", "6M", "YTD", "1Y", "ALL"];

const CustomChartTooltip = ({ active, payload, label, isPrivacyMode }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0]?.payload;
    const netWorth = dataPoint?.netWorth;
    const assets = dataPoint?.assets;
    const liabilities = dataPoint?.liabilities;

    return (
      <div
        style={{
          background: "rgba(17, 20, 26, 0.95)",
          border: "1px solid #30363D",
          borderRadius: 10,
          padding: "10px 14px",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(8px)",
          minWidth: 160,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#8B949E",
            marginBottom: 6,
            borderBottom: "1px solid #21262D",
            paddingBottom: 4,
          }}
        >
          {dataPoint?.fullDate || dataPoint?.date || label}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12 }}>
            <span style={{ color: "#8B949E" }}>Net Worth:</span>
            <span
              style={{
                fontWeight: 700,
                color: netWorth >= 0 ? "#10B981" : "#EF4444",
              }}
            >
              {formatRupiah(netWorth, isPrivacyMode)}
            </span>
          </div>

          {assets !== undefined && (
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 11 }}>
              <span style={{ color: "#8B949E" }}>Assets:</span>
              <span style={{ color: "#06B6D4", fontWeight: 600 }}>
                {formatRupiah(assets, isPrivacyMode)}
              </span>
            </div>
          )}

          {liabilities !== undefined && (
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 11 }}>
              <span style={{ color: "#8B949E" }}>Liabilities:</span>
              <span style={{ color: "#F43F5E", fontWeight: 600 }}>
                {formatRupiah(liabilities, isPrivacyMode)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function NetWorthChartCard({
  summaryData,
  historyData,
  trajectoryData,
  milestoneData,
  currentNetWorth = 0,
  onMilestoneChange,
  loading = false,
  chartLoading = false,
}) {
  const { isPrivacyMode, selectedTimeframe, setSelectedTimeframe } = useDashboard();
  const screens = Grid.useBreakpoint();
  const isMobile = screens.lg === false;

  const milestone = milestoneData;
  const summary = summaryData || historyData?.summary;

  // Resolve chart data based on active timeframe or direct trajectory data
  const rawHistory = historyData;
  const data = React.useMemo(() => {
    const rawList =
      Array.isArray(historyData?.history)
        ? historyData.history
        : Array.isArray(historyData)
          ? historyData
          : Array.isArray(trajectoryData)
            ? trajectoryData
            : (rawHistory && rawHistory[selectedTimeframe]) ||
            [];

    return rawList.map((item) => {
      if (item.date && item.netWorth !== undefined && typeof item.netWorth === "number") {
        return item;
      }
      const rawNw = item.net_worth ?? item.netWorth ?? 0;
      const rawAssets = item.total_assets ?? item.assets ?? item.totalAssets ?? 0;
      const rawLiabilities = item.total_liabilities ?? item.liabilities ?? item.totalLiabilities ?? 0;
      const dateStr = item.recorded_date ?? item.recordedDate ?? item.date ?? "";

      let formattedDate = dateStr;
      let fullDate = dateStr;
      if (dateStr) {
        const m = moment(dateStr);
        if (m.isValid()) {
          formattedDate = m.format("DD MMM");
          fullDate = m.format("DD MMM YYYY");
        }
      }

      return {
        date: formattedDate,
        fullDate: fullDate,
        rawDate: dateStr,
        netWorth: typeof rawNw === "number" ? rawNw : parseFloat(rawNw) || 0,
        assets: typeof rawAssets === "number" ? rawAssets : parseFloat(rawAssets) || 0,
        liabilities: typeof rawLiabilities === "number" ? rawLiabilities : parseFloat(rawLiabilities) || 0,
        growthPercentage: parseFloat(item.growth_percentage ?? 0) || 0,
      };
    });
  }, [historyData, trajectoryData, rawHistory, selectedTimeframe]);

  // Dynamic calculation of trajectory change directly from API data values
  const rawChangeAmount = summary?.change_amount ?? summary?.changeAmount;
  const changeAmount =
    rawChangeAmount !== undefined && rawChangeAmount !== null
      ? Number(rawChangeAmount)
      : data.length >= 2
        ? data[data.length - 1].netWorth - data[0].netWorth
        : 0;

  const rawChangePercentage = summary?.change_percentage ?? summary?.changePercentage;
  let numPercentage = 0;

  if (rawChangePercentage !== undefined && rawChangePercentage !== null) {
    numPercentage =
      typeof rawChangePercentage === "number"
        ? rawChangePercentage
        : parseFloat(rawChangePercentage) || 0;
  } else if (data.length >= 2 && data[0].netWorth !== 0) {
    const prevVal = Math.abs(data[0].netWorth);
    numPercentage = prevVal > 0 ? (changeAmount / prevVal) * 100 : 0;
  } else if (currentNetWorth !== 0 && currentNetWorth - changeAmount !== 0) {
    const prevVal = Math.abs(currentNetWorth - changeAmount);
    numPercentage = (changeAmount / prevVal) * 100;
  }

  // Determine negative/positive state strictly from numerical values
  const rawIsPositive = summary?.is_positive;
  const isPositive =
    rawIsPositive !== undefined
      ? Boolean(rawIsPositive)
      : changeAmount > 0 || numPercentage > 0;
  const isNegative = !isPositive && (changeAmount < 0 || numPercentage < 0);

  const changeColor = isNegative ? "#EF4444" : isPositive ? "#10B981" : "#8B949E";
  const changeIcon = isNegative ? "▼" : isPositive ? "▲" : "•";

  // Build dynamic adaptive label
  const formattedNominal = formatRupiah(changeAmount, isPrivacyMode, isPositive);
  const formattedPercent =
    numPercentage > 9999
      ? "> +9999%"
      : numPercentage < -9999
        ? "< -9999%"
        : numPercentage > 0
          ? `+${numPercentage.toFixed(1)}%`
          : isNegative
            ? `${numPercentage < 0 ? numPercentage.toFixed(1) : `-${numPercentage.toFixed(1)}`}%`
            : "0.0%";

  const timeframeLabel =
    selectedTimeframe === "1M"
      ? "vs last month"
      : selectedTimeframe === "ALL"
        ? "all time"
        : `in ${selectedTimeframe}`;

  const changeDisplayText = `${formattedNominal} (${formattedPercent}) ${timeframeLabel}`;

  /**
   * Dynamic "Nice Numbers" algorithm to calculate scale intervals
   * Automatically scales by order of magnitude
   */
  const calculateNiceStep = (range, targetTicks = 5) => {
    if (range <= 0) return 1000000;
    const rawStep = range / targetTicks;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const residual = rawStep / magnitude;

    let multiplier;
    if (residual <= 1.2) {
      multiplier = 1;
    } else if (residual <= 2.2) {
      multiplier = 2;
    } else if (residual <= 3.5) {
      multiplier = 2.5;
    } else if (residual <= 7.5) {
      multiplier = 5;
    } else {
      multiplier = 10;
    }

    return multiplier * magnitude;
  };

  // Calculate dynamic Y-axis ticks and bounds based on data range
  const { ticks, yMin, yMax } = React.useMemo(() => {
    if (!data || data.length === 0) {
      return {
        ticks: [-15000000, -10000000, -5000000, 0, 5000000],
        yMin: -15000000,
        yMax: 5000000,
      };
    }

    const values = data.map((d) => d.netWorth);
    let min = Math.min(...values);
    let max = Math.max(...values);

    if (min === max) {
      if (min > 0) {
        min = 0;
      } else if (min < 0) {
        max = 0;
      } else {
        min = -10000000;
        max = 10000000;
      }
    } else {
      if (min > 0 && min < max * 0.4) min = 0;
      if (max < 0 && max > min * 0.4) max = 0;
    }

    const rawRange = Math.max(Math.abs(max - min), 1000);
    const step = calculateNiceStep(rawRange, 5);

    const calculatedMin = Math.floor(min / step) * step;
    const calculatedMax = Math.ceil(max / step) * step;

    const ticksArr = [];
    for (let val = calculatedMin; val <= calculatedMax + step * 0.001; val += step) {
      ticksArr.push(Math.round(val));
    }

    if (calculatedMin <= 0 && calculatedMax >= 0 && !ticksArr.includes(0)) {
      ticksArr.push(0);
      ticksArr.sort((a, b) => a - b);
    }

    return {
      ticks: ticksArr,
      yMin: ticksArr[0],
      yMax: ticksArr[ticksArr.length - 1],
    };
  }, [data]);

  const calculateGradientOffset = () => {
    if (!data || data.length === 0) return 0.5;
    if (yMax <= 0) return 0;
    if (yMin >= 0) return 1;
    if (yMax === yMin) return 0.5;

    return yMax / (yMax - yMin);
  };

  const off = calculateGradientOffset();

  return (
    <Card
      loading={loading}
      variant="borderless"
      style={{
        background: "#161B22",
        border: "1px solid #21262D",
        borderRadius: 14,
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.25)",
        overflow: "hidden",
      }}
      styles={{
        body: {
          padding: isMobile ? "16px 14px" : "20px 24px",
        },
      }}
    >
      {/* Top Header Section */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: isMobile ? 12 : 16,
          marginBottom: isMobile ? 16 : 20,
        }}
      >
        {/* Left: Title & Subtitle Change */}
        <div>
          <div
            style={{
              fontSize: isMobile ? 16 : 18,
              fontWeight: 700,
              color: "#F0F6FC",
              letterSpacing: "-0.2px",
            }}
          >
            Net Worth Trajectory
          </div>

          <div
            style={{
              marginTop: 4,
              fontSize: isMobile ? 12 : 13,
              fontWeight: 600,
              color: changeColor,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>{changeIcon}</span>
            <span>{changeDisplayText}</span>
          </div>
        </div>

        {/* Center / Desktop Dynamic Milestone Tracker */}
        {!isMobile && (
          <div style={{ flex: "0 1 340px" }}>
            <MilestoneTracker
              milestoneData={milestone}
              currentNetWorth={currentNetWorth}
              onMilestoneChange={onMilestoneChange}
            />
          </div>
        )}

        {/* Right: Timeframe Pills */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: "#0D1117",
            border: "1px solid #21262D",
            borderRadius: 20,
            padding: 3,
            gap: 2,
            width: isMobile ? "100%" : "auto",
            justifyContent: isMobile ? "space-between" : "flex-start",
            boxSizing: "border-box",
            overflowX: isMobile ? "auto" : "visible",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {TIMEFRAMES.map((tf) => {
            const isSelected = selectedTimeframe === tf;
            return (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                style={{
                  background: isSelected ? "#21262D" : "transparent",
                  color: isSelected ? "#FFFFFF" : "#8B949E",
                  border: isSelected ? "1px solid #30363D" : "1px solid transparent",
                  borderRadius: 16,
                  padding: isMobile ? "4px 6px" : "4px 10px",
                  fontSize: 11,
                  fontWeight: isSelected ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  flex: isMobile ? 1 : "initial",
                  textAlign: "center",
                }}
              >
                {tf}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Milestone Tracker placed underneath header */}
      {isMobile && (
        <div style={{ marginBottom: 14 }}>
          <MilestoneTracker
            milestoneData={milestone}
            currentNetWorth={currentNetWorth}
            onMilestoneChange={onMilestoneChange}
            compact
          />
        </div>
      )}

      {/* Chart Canvas */}
      <Spin spinning={chartLoading} style={{ width: "100%" }}>
        <div style={{ width: "100%", height: isMobile ? 240 : 320, minHeight: isMobile ? 240 : 320 }}>
          {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 10,
                right: isMobile ? 8 : 20,
                left: isMobile ? 2 : 10,
                bottom: 0,
              }}
            >
              <defs>
                {/* Dynamic Dual color gradient fill */}
                <linearGradient id="splitFill" x1="0" y1="0" x2="0" y2="1">
                  {yMax <= 0 ? (
                    <>
                      <stop offset="0%" stopColor="#EF4444" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#EF4444" stopOpacity={0.03} />
                    </>
                  ) : yMin >= 0 ? (
                    <>
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0.03} />
                    </>
                  ) : (
                    <>
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset={`${Math.round(off * 100)}%`} stopColor="#06B6D4" stopOpacity={0.08} />
                      <stop offset={`${Math.round(off * 100)}%`} stopColor="#EF4444" stopOpacity={0.08} />
                      <stop offset="100%" stopColor="#EF4444" stopOpacity={0.4} />
                    </>
                  )}
                </linearGradient>

                {/* Spline line stroke gradient */}
                <linearGradient id="splitStroke" x1="0" y1="0" x2="0" y2="1">
                  {yMax <= 0 ? (
                    <>
                      <stop offset="0%" stopColor="#F87171" />
                      <stop offset="100%" stopColor="#EF4444" />
                    </>
                  ) : yMin >= 0 ? (
                    <>
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#34D399" />
                    </>
                  ) : (
                    <>
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset={`${Math.round(off * 100)}%`} stopColor="#38BDF8" />
                      <stop offset={`${Math.round(off * 100)}%`} stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#EF4444" />
                    </>
                  )}
                </linearGradient>
              </defs>

              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6E7681", fontSize: 11 }}
                dy={8}
                interval="preserveStartEnd"
                minTickGap={28}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                domain={[yMin, yMax]}
                ticks={ticks}
                width={isMobile ? 64 : 74}
                tick={{ fill: "#6E7681", fontSize: isMobile ? 10 : 11 }}
                tickFormatter={(val) => {
                  if (isPrivacyMode) return "•••";
                  if (val === 0) return "Rp\u00A00";
                  const abs = Math.abs(val);
                  const sign = val < 0 ? "-" : "";
                  if (abs >= 1000000000000) {
                    const num = (abs / 1000000000000) % 1 === 0 ? abs / 1000000000000 : parseFloat((abs / 1000000000000).toFixed(2));
                    return `${sign}Rp\u00A0${num}T`;
                  }
                  if (abs >= 1000000000) {
                    const num = (abs / 1000000000) % 1 === 0 ? abs / 1000000000 : parseFloat((abs / 1000000000).toFixed(2));
                    return `${sign}Rp\u00A0${num}B`;
                  }
                  if (abs >= 1000000) {
                    const num = (abs / 1000000) % 1 === 0 ? abs / 1000000 : parseFloat((abs / 1000000).toFixed(2));
                    return `${sign}Rp\u00A0${num}M`;
                  }
                  if (abs >= 1000) {
                    const num = (abs / 1000) % 1 === 0 ? abs / 1000 : parseFloat((abs / 1000).toFixed(2));
                    return `${sign}Rp\u00A0${num}K`;
                  }
                  return `${sign}Rp\u00A0${abs}`;
                }}
              />

              {/* Zero Break-Even Reference Line */}
              <ReferenceLine
                y={0}
                stroke="#485260"
                strokeDasharray="4 4"
                strokeWidth={1.2}
                label={{
                  value: "Break-Even (Rp 0)",
                  fill: "#8B949E",
                  position: "insideTopLeft",
                  fontSize: 11,
                  fontWeight: 500,
                  offset: 8,
                }}
              />

              <Tooltip
                content={<CustomChartTooltip isPrivacyMode={isPrivacyMode} />}
                cursor={{ stroke: "#30363D", strokeWidth: 1, strokeDasharray: "3 3" }}
              />

              <Area
                type="monotone"
                dataKey="netWorth"
                stroke="url(#splitStroke)"
                strokeWidth={2.5}
                fill="url(#splitFill)"
                activeDot={{
                  r: 6,
                  fill: "#FFFFFF",
                  stroke: "#38BDF8",
                  strokeWidth: 2,
                  boxShadow: "0 0 10px #38BDF8",
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
          ) : chartLoading ? null : (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#6E7681",
                fontSize: 13,
              }}
            >
              No trajectory data available for timeframe {selectedTimeframe}
            </div>
          )}
        </div>
      </Spin>
    </Card>
  );
}
