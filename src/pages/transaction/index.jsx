import { useState, useMemo, useEffect } from "react";
import {
  Button,
  Card,
  Row,
  Col,
  Segmented,
  DatePicker,
  Space,
  Tag,
  Popconfirm,
  App,
  Grid,
  Input,
  Select,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  SettingOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  SwapOutlined,
  SearchOutlined,
  AppstoreOutlined,
  TableOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import PageHeader from "src/components/PageHeader";
import ListingTable from "src/components/ListingTable";
import TransactionForm from "./TransactionForm";
import CategoryDrawer from "./CategoryDrawer";
import api from "src/pkg/api";
import { formatRupiah } from "src/pkg/helper";
import { useDashboard } from "src/context/DashboardContext";

export default function TransactionPage() {
  const { message } = App.useApp();
  const { isPrivacyMode } = useDashboard();
  
  // Date & Period Filter
  const [filterType, setFilterType] = useState("month"); // "week" | "month" | "year" | "range" | "all"
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedRange, setSelectedRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);

  // Search, Type, & Sort Filters (Works on both Mobile & Desktop)
  const [searchKeyword, setSearchKeyword] = useState("");
  const [transactionType, setTransactionType] = useState("all"); // "all" | "income" | "expense"
  const [sortOption, setSortOption] = useState("transaction_date desc");
  const [viewMode, setViewMode] = useState("card"); // "card" | "table" on mobile

  const [formOpen, setFormOpen] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState(null);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const [stats, setStats] = useState({ income: 0, expense: 0, net: 0 });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const screens = Grid.useBreakpoint();
  const isMobile = screens.sm === false;

  const extraParams = useMemo(() => {
    const params = {};
    if (filterType !== "all") {
      params.filter_type = filterType;
      if (filterType === "range") {
        if (selectedRange && selectedRange[0] && selectedRange[1]) {
          params.start_date = selectedRange[0].format("YYYY-MM-DD");
          params.end_date = selectedRange[1].format("YYYY-MM-DD");
        }
      } else {
        params.date = selectedDate
          ? selectedDate.format("YYYY-MM-DD")
          : dayjs().format("YYYY-MM-DD");
      }
    }

    if (searchKeyword && searchKeyword.trim()) {
      params.search = searchKeyword.trim();
      params.category_name = searchKeyword.trim();
    }

    if (transactionType !== "all") {
      params.category_type = transactionType;
    }

    if (sortOption) {
      params.sort = sortOption;
    }

    return params;
  }, [filterType, selectedDate, selectedRange, searchKeyword, transactionType, sortOption]);

  const fetchSummaryStats = async () => {
    try {
      const params = {
        ...extraParams,
      };
      const res = await api.get("/v1/transactions/summary", { params });
      const summary = res.data?.data || { income: 0, expense: 0, net: 0 };

      setStats({
        income: Number(summary.income) || 0,
        expense: Number(summary.expense) || 0,
        net: Number(summary.net) || 0,
      });
    } catch (err) {
      console.error("Failed to load summary statistics:", err);
    }
  };

  useEffect(() => {
    fetchSummaryStats();
  }, [JSON.stringify(extraParams), refreshTrigger]);

  const handleEdit = (id) => {
    setSelectedTxId(id);
    setFormOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/v1/transactions/${id}`);
      message.success("Transaction deleted successfully");
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      message.error(
        err.response?.data?.message || "Failed to delete transaction",
      );
    }
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "transaction_date",
      key: "transaction_date",
      showSorter: true,
      width: "15%",
      render: (val) => dayjs(val).format("YYYY-MM-DD"),
    },
    {
      title: "Category",
      dataIndex: "category_name",
      key: "category_name",
      showSearch: true,
      showSorter: true,
      width: "20%",
      render: (val, record) => {
        const isIncome = record.category_type === "income";
        return (
          <Space align="center" size={8}>
            <Tooltip title={isIncome ? "Income" : "Expense"}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: isIncome ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)",
                  color: isIncome ? "#10B981" : "#F43F5E",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  flexShrink: 0,
                }}
              >
                {isIncome ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
              </div>
            </Tooltip>
            <span style={{ fontWeight: 600, color: "#F0F6FC" }}>{val}</span>
          </Space>
        );
      },
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      showSearch: true,
      width: "25%",
      render: (val) => <span style={{ color: "#8B949E" }}>{val || "-"}</span>,
    },
    {
      title: "Link Account",
      key: "link",
      width: "18%",
      render: (_, record) => {
        if (record.asset_id) {
          return (
            <Tag color="blue" style={{ borderRadius: 6, margin: 0, fontSize: 11 }}>
              Asset: {record.asset_name}
            </Tag>
          );
        }
        if (record.liability_id) {
          return (
            <Tag color="warning" style={{ borderRadius: 6, margin: 0, fontSize: 11 }}>
              Liability: {record.liability_name}
            </Tag>
          );
        }
        return <span style={{ color: "#6E7681" }}>-</span>;
      },
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      showSorter: true,
      align: "right",
      width: "15%",
      render: (val, record) => {
        const isIncome = record.category_type === "income";
        const sign = isIncome ? "+" : "-";
        return (
          <span
            style={{
              color: isIncome ? "#10B981" : "#F43F5E",
              fontWeight: 700,
            }}
          >
            {sign}{formatRupiah(val, isPrivacyMode)}
          </span>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      width: "10%",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined style={{ color: "#8B949E" }} />}
            onClick={() => handleEdit(record.id)}
            style={{ width: 28, height: 28, padding: 0 }}
          />
          <Popconfirm
            title="Delete this transaction?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              style={{ width: 28, height: 28, padding: 0 }}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Mobile item card renderer
  const renderMobileTransaction = (record) => {
    const isIncome = record.category_type === "income";
    const dateStr = dayjs(record.transaction_date).format("DD MMM YYYY");

    return (
      <div
        key={record.id || record.key}
        style={{
          background: "#161B22",
          border: "1px solid #21262D",
          borderRadius: 12,
          padding: "12px 14px",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          transition: "all 0.2s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
          {/* Category Icon Badge */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: isIncome ? "rgba(16, 185, 129, 0.12)" : "rgba(244, 63, 94, 0.12)",
              color: isIncome ? "#10B981" : "#F43F5E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            {isIncome ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
          </div>

          {/* Info */}
          <div style={{ overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  color: "#F0F6FC",
                  fontWeight: 600,
                  fontSize: 13,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {record.category_name}
              </span>
            </div>

            <div
              style={{
                fontSize: 11,
                color: "#8B949E",
                marginTop: 2,
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              <span>{dateStr}</span>
              {record.notes && record.notes !== "-" && (
                <>
                  <span>•</span>
                  <span
                    style={{
                      maxWidth: 110,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {record.notes}
                  </span>
                </>
              )}
              {record.asset_name && (
                <Tag
                  color="blue"
                  style={{
                    fontSize: 9,
                    padding: "0 4px",
                    lineHeight: "16px",
                    borderRadius: 4,
                    margin: 0,
                  }}
                >
                  {record.asset_name}
                </Tag>
              )}
              {record.liability_name && (
                <Tag
                  color="warning"
                  style={{
                    fontSize: 9,
                    padding: "0 4px",
                    lineHeight: "16px",
                    borderRadius: 4,
                    margin: 0,
                  }}
                >
                  {record.liability_name}
                </Tag>
              )}
            </div>
          </div>
        </div>

        {/* Amount & Actions */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 13,
              color: isIncome ? "#10B981" : "#F43F5E",
            }}
          >
            {isIncome ? "+" : "-"}{formatRupiah(record.amount, isPrivacyMode)}
          </div>

          <div style={{ marginTop: 4, display: "flex", justifyContent: "flex-end", gap: 4 }}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ fontSize: 12, color: "#8B949E" }} />}
              onClick={() => handleEdit(record.id)}
              style={{ width: 22, height: 22, padding: 0 }}
            />
            <Popconfirm
              title="Delete this transaction?"
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined style={{ fontSize: 12 }} />}
                style={{ width: 22, height: 22, padding: 0 }}
              />
            </Popconfirm>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <PageHeader />

      {/* Summary Cards */}
      <Row gutter={isMobile ? [8, 8] : [16, 16]} style={{ marginBottom: isMobile ? "12px" : "16px" }}>
        {/* Total Income */}
        <Col xs={8} sm={8}>
          <Card
            variant="borderless"
            style={{
              background: "#161B22",
              border: "1px solid #21262D",
              borderRadius: 14,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
              height: "100%",
              position: "relative",
              overflow: "hidden",
            }}
            styles={{
              body: {
                padding: isMobile ? "10px 8px" : "18px 20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "100%",
                boxSizing: "border-box",
              },
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span
                style={{
                  fontSize: isMobile ? 9 : 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#8B949E",
                  letterSpacing: "0.5px",
                }}
              >
                {isMobile ? "Income" : "Total Income"}
              </span>
              <div
                style={{
                  width: isMobile ? 20 : 30,
                  height: isMobile ? 20 : 30,
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.12)",
                  color: "#10B981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isMobile ? 10 : 14,
                }}
              >
                <ArrowDownOutlined />
              </div>
            </div>

            <div style={{ marginTop: isMobile ? 4 : 12 }}>
              <div
                style={{
                  fontSize: isMobile ? 12 : 24,
                  fontWeight: 800,
                  color: "#10B981",
                  letterSpacing: "-0.3px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {formatRupiah(stats.income, isPrivacyMode)}
              </div>
            </div>
          </Card>
        </Col>

        {/* Total Expense */}
        <Col xs={8} sm={8}>
          <Card
            variant="borderless"
            style={{
              background: "#161B22",
              border: "1px solid #21262D",
              borderRadius: 14,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
              height: "100%",
              position: "relative",
              overflow: "hidden",
            }}
            styles={{
              body: {
                padding: isMobile ? "10px 8px" : "18px 20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "100%",
                boxSizing: "border-box",
              },
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span
                style={{
                  fontSize: isMobile ? 9 : 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#8B949E",
                  letterSpacing: "0.5px",
                }}
              >
                {isMobile ? "Expense" : "Total Expense"}
              </span>
              <div
                style={{
                  width: isMobile ? 20 : 30,
                  height: isMobile ? 20 : 30,
                  borderRadius: "50%",
                  background: "rgba(244, 63, 94, 0.12)",
                  color: "#F43F5E",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isMobile ? 10 : 14,
                }}
              >
                <ArrowUpOutlined />
              </div>
            </div>

            <div style={{ marginTop: isMobile ? 4 : 12 }}>
              <div
                style={{
                  fontSize: isMobile ? 12 : 24,
                  fontWeight: 800,
                  color: "#F43F5E",
                  letterSpacing: "-0.3px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {formatRupiah(stats.expense, isPrivacyMode)}
              </div>
            </div>
          </Card>
        </Col>

        {/* Net Cashflow */}
        <Col xs={8} sm={8}>
          <Card
            variant="borderless"
            style={{
              background: "#161B22",
              border: "1px solid #21262D",
              borderRadius: 14,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
              height: "100%",
              position: "relative",
              overflow: "hidden",
            }}
            styles={{
              body: {
                padding: isMobile ? "10px 8px" : "18px 20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                height: "100%",
                boxSizing: "border-box",
              },
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span
                style={{
                  fontSize: isMobile ? 9 : 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#8B949E",
                  letterSpacing: "0.5px",
                }}
              >
                {isMobile ? "Net" : "Net Cashflow"}
              </span>
              <div
                style={{
                  width: isMobile ? 20 : 30,
                  height: isMobile ? 20 : 30,
                  borderRadius: "50%",
                  background:
                    stats.net > 0
                      ? "rgba(16, 185, 129, 0.12)"
                      : stats.net < 0
                        ? "rgba(244, 63, 94, 0.12)"
                        : "rgba(56, 189, 248, 0.12)",
                  color: stats.net > 0 ? "#10B981" : stats.net < 0 ? "#F43F5E" : "#38BDF8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isMobile ? 10 : 14,
                }}
              >
                <SwapOutlined />
              </div>
            </div>

            <div style={{ marginTop: isMobile ? 4 : 12 }}>
              <div
                style={{
                  fontSize: isMobile ? 12 : 24,
                  fontWeight: 800,
                  color: stats.net > 0 ? "#10B981" : stats.net < 0 ? "#F43F5E" : "#F0F6FC",
                  letterSpacing: "-0.3px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {formatRupiah(stats.net, isPrivacyMode, stats.net > 0)}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Primary Toolbar: Timeframe + Action Buttons */}
      <div
        style={{
          background: "#161B22",
          border: "1px solid #21262D",
          borderRadius: 14,
          padding: isMobile ? "10px" : "12px 16px",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "center",
          marginBottom: 10,
          gap: "10px",
        }}
      >
        {/* Left: Timeframe Segmented & Date Picker */}
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
            gap: "8px",
            width: isMobile ? "100%" : "auto",
          }}
        >
          <Segmented
            block={isMobile}
            options={[
              { label: "Week", value: "week" },
              { label: "Month", value: "month" },
              { label: "Year", value: "year" },
              { label: "Range", value: "range" },
              { label: "All", value: "all" },
            ]}
            value={filterType}
            onChange={(val) => setFilterType(val)}
            style={{
              background: "#0D1117",
              border: "1px solid #21262D",
              padding: "3px",
              borderRadius: "8px",
            }}
          />

          {filterType !== "all" &&
            (filterType === "range" ? (
              <DatePicker.RangePicker
                value={selectedRange}
                onChange={(dates) => setSelectedRange(dates)}
                allowClear={false}
                style={{
                  width: isMobile ? "100%" : 240,
                  background: "#0D1117",
                  borderColor: "#21262D",
                  borderRadius: 8,
                }}
              />
            ) : (
              <DatePicker
                picker={filterType}
                value={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                allowClear={false}
                style={{
                  width: isMobile ? "100%" : 150,
                  background: "#0D1117",
                  borderColor: "#21262D",
                  borderRadius: 8,
                }}
              />
            ))}
        </div>

        {/* Right: Category Drawer & Add Button */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            width: isMobile ? "100%" : "auto",
          }}
        >
          <Button
            style={{
              flex: isMobile ? 1 : "none",
              background: "#21262D",
              border: "1px solid #30363D",
              color: "#F0F6FC",
              borderRadius: 8,
              fontWeight: 500,
            }}
            icon={<SettingOutlined />}
            onClick={() => setCategoryOpen(true)}
          >
            Categories
          </Button>
          <Button
            type="primary"
            style={{
              flex: isMobile ? 1 : "none",
              background: "linear-gradient(90deg, #2563EB 0%, #38BDF8 100%)",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              boxShadow: "0 0 10px rgba(37, 99, 235, 0.4)",
            }}
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedTxId(null);
              setFormOpen(true);
            }}
          >
            Add
          </Button>
        </div>
      </div>

      {/* Secondary Filter Bar: Search, Type Filter, Sort, & View Toggle */}
      <div
        style={{
          background: "#161B22",
          border: "1px solid #21262D",
          borderRadius: 14,
          padding: isMobile ? "10px" : "10px 16px",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "center",
          marginBottom: isMobile ? "12px" : "16px",
          gap: "10px",
        }}
      >
        {/* Search Input */}
        <div style={{ flex: 1, minWidth: isMobile ? "100%" : 220 }}>
          <Input
            prefix={<SearchOutlined style={{ color: "#8B949E" }} />}
            placeholder="Search category, notes..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            allowClear
            style={{
              background: "#0D1117",
              borderColor: "#21262D",
              borderRadius: 8,
              color: "#F0F6FC",
            }}
          />
        </div>

        {/* Quick Filter Group: Type & Sort */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
            justifyContent: isMobile ? "space-between" : "flex-end",
          }}
        >
          {/* Type Segmented (All / Income / Expense) */}
          <Segmented
            options={[
              { label: "All", value: "all" },
              { label: "Income", value: "income" },
              { label: "Expense", value: "expense" },
            ]}
            value={transactionType}
            onChange={(val) => setTransactionType(val)}
            style={{
              background: "#0D1117",
              border: "1px solid #21262D",
              padding: "2px",
              borderRadius: "8px",
              fontSize: 11,
            }}
          />

          {/* Sort Selector */}
          <Select
            value={sortOption}
            onChange={(val) => setSortOption(val)}
            style={{ width: isMobile ? "auto" : 160, flex: isMobile ? 1 : "none" }}
            popupMatchSelectWidth={false}
            options={[
              { label: "Newest First", value: "transaction_date desc" },
              { label: "Oldest First", value: "transaction_date asc" },
              { label: "Highest Amount", value: "amount desc" },
              { label: "Lowest Amount", value: "amount asc" },
            ]}
          />

          {/* Mobile View Toggle: Cards vs Table */}
          {isMobile && (
            <Tooltip title={viewMode === "card" ? "Switch to Table View" : "Switch to Card View"}>
              <Button
                icon={viewMode === "card" ? <TableOutlined /> : <AppstoreOutlined />}
                onClick={() => setViewMode((prev) => (prev === "card" ? "table" : "card"))}
                style={{
                  background: "#0D1117",
                  borderColor: "#21262D",
                  color: "#8B949E",
                  borderRadius: 8,
                }}
              />
            </Tooltip>
          )}
        </div>
      </div>

      {/* Main Table / Mobile List */}
      <ListingTable
        key={refreshTrigger}
        columns={columns}
        endpoint="/v1/transactions"
        extraParams={extraParams}
        renderMobileItem={viewMode === "card" ? renderMobileTransaction : null}
      />

      {/* Forms & Drawers */}
      <TransactionForm
        open={formOpen}
        transactionId={selectedTxId}
        onClose={() => setFormOpen(false)}
        onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
      />

      <CategoryDrawer
        open={categoryOpen}
        onClose={() => setCategoryOpen(false)}
        onCategoriesUpdated={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </>
  );
}
