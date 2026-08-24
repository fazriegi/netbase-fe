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
} from "antd";
import {
  PlusOutlined,
  SettingOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import numeral from "numeral";
import dayjs from "dayjs";
import PageHeader from "src/components/PageHeader";
import ListingTable from "src/components/ListingTable";
import TransactionForm from "./TransactionForm";
import CategoryDrawer from "./CategoryDrawer";
import api from "src/pkg/api";

export default function TransactionPage() {
  const { message } = App.useApp();
  const [filterType, setFilterType] = useState("month"); // "week" | "month" | "year" | "range" | "all"
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedRange, setSelectedRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);

  const [formOpen, setFormOpen] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState(null);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const [stats, setStats] = useState({ income: 0, expense: 0, net: 0 });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
    return params;
  }, [filterType, selectedDate, selectedRange]);

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
      render: (val, record) => (
        <Space>
          <span>{val}</span>
          <Tag color={record.category_type === "income" ? "success" : "error"}>
            {record.category_type === "income" ? "Income" : "Expense"}
          </Tag>
        </Space>
      ),
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      showSearch: true,
      width: "25%",
      render: (val) => val || "-",
    },
    {
      title: "Link Account",
      key: "link",
      width: "20%",
      render: (_, record) => {
        if (record.asset_id) {
          return <Tag color="blue">Asset: {record.asset_name}</Tag>;
        }
        if (record.liability_id) {
          return <Tag color="warning">Liability: {record.liability_name}</Tag>;
        }
        return "-";
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
        return (
          <span
            style={{
              color: isIncome ? "#52c41a" : "#f5222d",
              fontWeight: "bold",
            }}
          >
            {isIncome ? "+" : "-"} {numeral(val).format("0,0")}
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
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.id)}
          />
          <Popconfirm
            title="Are you sure you want to delete this transaction?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const screens = Grid.useBreakpoint();
  const isMobile = !screens.sm;

  const netStats = useMemo(() => {
    let color = "#ffffff";
    let prefix = "";
    let glow = "rgba(255, 255, 255, 0.3)";

    if (stats.net > 0) {
      color = "#10b981";
      prefix = "+";
      glow = "rgba(16, 185, 129, 0.5)";
    } else if (stats.net < 0) {
      color = "#ff4d4f";
      prefix = "";
      glow = "rgba(255, 77, 79, 0.5)";
    }

    return { color, prefix, glow };
  }, [stats.net]);

  return (
    <>
      <PageHeader />

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: "1.5em" }}>
        {/* Total Income */}
        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            styles={{ body: { padding: isMobile ? "12px 16px" : "24px" } }}
            style={{
              background: "linear-gradient(180deg, #1d432b 0%, #0f2417 100%)",
              borderRadius: 12,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "4px",
                backgroundColor: "#10b981",
                boxShadow: "0 0 8px rgba(16, 185, 129, 0.5)",
              }}
            />
            <div style={{ padding: isMobile ? "0" : "8px 0" }}>
              <span
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: "600",
                  textTransform: "uppercase",
                  color: "#8abea1",
                  letterSpacing: "0.5px",
                }}
              >
                Total Income
              </span>
              <h1
                style={{
                  margin: "4px 0 0 0",
                  fontSize: isMobile ? 22 : 28,
                  color: "#10b981",
                  fontWeight: "bold",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Rp {numeral(stats.income).format("0,0")}
              </h1>
            </div>
          </Card>
        </Col>

        {/* Total Expense */}
        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            styles={{ body: { padding: isMobile ? "12px 16px" : "24px" } }}
            style={{
              background: "linear-gradient(180deg, #5c2424 0%, #2b1111 100%)",
              borderRadius: 12,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "4px",
                backgroundColor: "#ff4d4f",
                boxShadow: "0 0 8px rgba(255, 77, 79, 0.5)",
              }}
            />
            <div style={{ padding: isMobile ? "0" : "8px 0" }}>
              <span
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: "600",
                  textTransform: "uppercase",
                  color: "#b38c8c",
                  letterSpacing: "0.5px",
                }}
              >
                Total Expense
              </span>
              <h1
                style={{
                  margin: "4px 0 0 0",
                  fontSize: isMobile ? 22 : 28,
                  color: "#ff4d4f",
                  fontWeight: "bold",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Rp {numeral(stats.expense).format("0,0")}
              </h1>
            </div>
          </Card>
        </Col>

        {/* Net Cashflow */}
        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            styles={{ body: { padding: isMobile ? "12px 16px" : "24px" } }}
            style={{
              background: "linear-gradient(180deg, #1c3d5a 0%, #0d1e2d 100%)",
              borderRadius: 12,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "4px",
                backgroundColor: netStats.color,
                boxShadow: `0 0 8px ${netStats.glow}`,
              }}
            />
            <div style={{ padding: isMobile ? "0" : "8px 0" }}>
              <span
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: "600",
                  textTransform: "uppercase",
                  color: "#8b9bb4",
                  letterSpacing: "0.5px",
                }}
              >
                Net Cashflow
              </span>
              <h1
                style={{
                  margin: "4px 0 0 0",
                  fontSize: isMobile ? 22 : 28,
                  color: netStats.color,
                  fontWeight: "bold",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Rp {netStats.prefix}
                {numeral(stats.net).format("0,0")}
              </h1>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filter and Action Controls */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "center",
          marginBottom: "1.5em",
          gap: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
            gap: "12px",
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
            style={{ padding: "4px", borderRadius: "8px" }}
          />

          {filterType !== "all" &&
            (filterType === "range" ? (
              <DatePicker.RangePicker
                value={selectedRange}
                onChange={(dates) => setSelectedRange(dates)}
                allowClear={false}
                style={{ width: "100%" }}
              />
            ) : (
              <DatePicker
                picker={filterType}
                value={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                allowClear={false}
                style={{ width: "100%" }}
              />
            ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            width: isMobile ? "100%" : "auto",
          }}
        >
          <Button
            style={{ flex: isMobile ? 1 : "none" }}
            icon={<SettingOutlined />}
            onClick={() => setCategoryOpen(true)}
          >
            Categories
          </Button>
          <Button
            type="primary"
            style={{ flex: isMobile ? 1 : "none" }}
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

      {/* Main Table */}
      <ListingTable
        key={refreshTrigger}
        columns={columns}
        endpoint="/v1/transactions"
        extraParams={extraParams}
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
