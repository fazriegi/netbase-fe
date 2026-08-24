import React, { useState, useEffect, useCallback } from "react";
import { Row, Col, App as AntdApp } from "antd";
import NetworthCard from "src/components/modules/dashboard/NetworthCard";
import AssetCard from "src/components/modules/dashboard/AssetCard";
import LiabilityCard from "src/components/modules/dashboard/LiabilityCard";
import DebtRatioCard from "src/components/modules/dashboard/DebtRatioCard";
import NetWorthChartCard from "src/components/modules/dashboard/NetWorthChartCard";
import CashflowCard from "src/components/modules/dashboard/CashflowCard";
import UpcomingDueDatesCard from "src/components/modules/dashboard/UpcomingDueDatesCard";
import { useDashboard } from "src/context/DashboardContext";
import api from "src/pkg/api";
import moment from "moment";

export default function Home() {
  const { message } = AntdApp.useApp();
  const { selectedTimeframe } = useDashboard();

  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({});

  const fetchNetWorth = useCallback(async () => {
    try {
      const response = await api.get(`/v1/dashboard/networth`);
      const respBody = response?.data;
      const data = respBody?.data !== undefined ? respBody.data : respBody;
      if (data) {
        setDashboardData((prev) => ({
          ...prev,
          kpi: data,
        }));
      }
    } catch (err) {
      const apiMessage = err?.response?.data?.message;
      if (apiMessage && err?.response?.status !== 404) {
        message.error(apiMessage);
      }
    }
  }, [message]);

  const fetchNetworthHistory = useCallback(async (timeframe = "ALL") => {
    try {
      const response = await api.get(`/v1/dashboard/networth/history?timeframe=${timeframe}`);
      const respBody = response?.data;
      const data = respBody?.data !== undefined ? respBody.data : respBody;
      if (data) {
        setDashboardData((prev) => ({
          ...prev,
          trajectoryHistory: data,
        }));
      }
    } catch (err) {
      const apiMessage = err?.response?.data?.message;
      if (apiMessage && err?.response?.status !== 404) {
        message.error(apiMessage);
      }
    }
  }, [message]);

  const fetchCashflowData = useCallback(async () => {
    try {
      const period = moment().format("YYYY-MM");
      const response = await api.get(`/v1/dashboard/cashflow?period=${period}`);
      const respBody = response?.data;
      if (respBody?.is_success && respBody?.data) {
        setDashboardData((prev) => ({
          ...prev,
          cashflow: respBody.data,
        }));
      }
    } catch (err) {
      const apiMessage = err?.response?.data?.message;
      if (apiMessage && err?.response?.status !== 404) {
        message.error(apiMessage);
      }
    }
  }, [message]);

  const fetchMilestone = useCallback(async () => {
    try {
      const response = await api.get(`/v1/dashboard/milestone`);
      const respBody = response?.data;
      if (respBody?.is_success && respBody?.data) {
        setDashboardData((prev) => ({
          ...prev,
          milestone: respBody.data,
        }));
      }
    } catch (err) {
      const apiMessage = err?.response?.data?.message;
      if (apiMessage && err?.response?.status !== 404) {
        message.error(apiMessage);
      }
    }
  }, [message]);

  const fetchAllDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.allSettled([
        fetchNetWorth(),
        fetchNetworthHistory(selectedTimeframe || "1M"),
        fetchCashflowData(),
        fetchMilestone(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchNetWorth, fetchNetworthHistory, selectedTimeframe, fetchCashflowData, fetchMilestone]);

  useEffect(() => {
    fetchAllDashboardData();
  }, [fetchAllDashboardData]);

  useEffect(() => {
    fetchNetworthHistory(selectedTimeframe || "1M");
  }, [fetchNetworthHistory, selectedTimeframe]);

  const handleMilestoneChange = async (newMilestone) => {
    try {
      setLoading(true);
      const payload = {
        title: newMilestone?.title,
        target_amount: newMilestone?.target_amount ?? newMilestone?.targetAmount ?? 0,
      };

      const response = await api.post("/v1/milestones", payload);
      const respBody = response?.data;

      if (respBody?.is_success || response?.status === 200 || response?.status === 201) {
        message.success("Milestone successfully updated!");
        await fetchMilestone();
      }
    } catch (err) {
      const apiMessage = err?.response?.data?.message || "Failed to update milestone";
      message.error(apiMessage);
    } finally {
      setLoading(false);
    }
  };

  const currentNetWorth = Number(dashboardData?.kpi?.net_worth ?? dashboardData?.kpi?.netWorth ?? 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Row 1: KPI Cards Grid */}
      {/* Mobile rule: Net Worth 100%, Assets 50%, Liabilities 50%, Debt Ratio 100% */}
      <Row gutter={[16, 16]} align="stretch">
        <Col xs={24} sm={24} md={12} lg={7} xl={7}>
          <NetworthCard data={dashboardData?.kpi} loading={loading} />
        </Col>

        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <AssetCard data={dashboardData?.kpi} loading={loading} />
        </Col>

        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <LiabilityCard data={dashboardData?.kpi} loading={loading} />
        </Col>

        <Col xs={24} sm={24} md={12} lg={5} xl={5}>
          <DebtRatioCard data={dashboardData?.kpi} loading={loading} />
        </Col>
      </Row>

      {/* Row 2: Net Worth Trajectory Spline Chart & Dynamic Milestone Tracker */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <NetWorthChartCard
            summaryData={dashboardData?.trajectorySummary}
            historyData={dashboardData?.trajectoryHistory}
            milestoneData={dashboardData?.milestone}
            currentNetWorth={currentNetWorth}
            onMilestoneChange={handleMilestoneChange}
            loading={loading}
          />
        </Col>
      </Row>

      {/* Row 3: Tactical Insights (Monthly Cashflow + Upcoming Due Dates) */}
      <Row gutter={[16, 16]} align="stretch">
        <Col xs={24} sm={24} lg={12} xl={12}>
          <CashflowCard data={dashboardData?.cashflow} loading={loading} />
        </Col>

        <Col xs={24} sm={24} lg={12} xl={12}>
          <UpcomingDueDatesCard
            dueDatesData={dashboardData?.upcomingDueDates}
            loading={loading}
          />
        </Col>
      </Row>
    </div>
  );
}
