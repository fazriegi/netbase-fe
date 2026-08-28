import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Button,
  Tag,
  Segmented,
  Card,
  Row,
  Col,
  Input,
  Select,
  Space,
  Popconfirm,
  App as AntdApp,
  Grid,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  CreditCardOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import ListingTable from "src/components/ListingTable";
import PageHeader from "src/components/PageHeader";
import { formatRupiah } from "src/pkg/helper";
import { useDashboard } from "src/context/DashboardContext";
import api from "src/pkg/api";

const SORT_OPTIONS = [
  { label: "Newest Added", value: "created_at desc" },
  { label: "Oldest Added", value: "created_at asc" },
  { label: "Highest Balance", value: "remaining_balance desc" },
  { label: "Lowest Balance", value: "remaining_balance asc" },
  { label: "Name (A-Z)", value: "name asc" },
  { label: "Name (Z-A)", value: "name desc" },
];

export default function LiabilityPage() {
  const { message } = AntdApp.useApp();
  const { isPrivacyMode } = useDashboard();
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const isMobile = screens.sm === false;

  const [filterStatus, setFilterStatus] = useState("active");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOption, setSortOption] = useState("created_at desc");
  const [categories, setCategories] = useState([]);
  const [kpiData, setKpiData] = useState({ totalLiabilities: 0 });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch Category options for filter
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/v1/liabilities/categories");
        const respBody = res?.data;
        const list = respBody?.data || respBody || [];
        if (Array.isArray(list)) {
          setCategories(list);
        }
      } catch {
        // Fallback silently
      }
    };
    fetchCategories();
  }, []);

  // Fetch KPI data (Total Liabilities)
  const fetchKPI = useCallback(async () => {
    try {
      const res = await api.get("/v1/dashboard/networth");
      const respData = res?.data?.data !== undefined ? res.data.data : res.data;
      if (respData) {
        setKpiData({
          totalLiabilities: Number(
            respData.total_liabilities ?? respData.totalLiabilities ?? 0
          ),
        });
      }
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    fetchKPI();
  }, [fetchKPI, refreshTrigger]);

  const extraParams = useMemo(() => {
    const params = {};

    if (filterStatus === "active") params.is_active = true;
    if (filterStatus === "paid") params.is_active = false;

    if (searchKeyword && searchKeyword.trim()) {
      params.search = searchKeyword.trim();
      params.name = searchKeyword.trim();
    }

    if (selectedCategory && selectedCategory !== "all") {
      params.category_id = selectedCategory;
    }

    if (sortOption) {
      params.sort = sortOption;
    }

    return params;
  }, [filterStatus, searchKeyword, selectedCategory, sortOption]);

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const response = await api.delete(`/v1/liabilities/${id}`);
      const respBody = response?.data;
      if (respBody?.is_success || response?.status === 200) {
        message.success(respBody?.message || "Liability deleted successfully");
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err) {
      const apiMessage =
        err?.response?.data?.message || err?.message || "Failed to delete liability";
      message.error(apiMessage);
    }
  };

  const columns = [
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      showSearch: true,
      showSorter: true,
      width: "20%",
      render: (val, record) => {
        const typeLabel =
          record.category_type === "short_term"
            ? "Short Term"
            : record.category_type === "long_term"
              ? "Long Term"
              : "";

        return (
          <div>
            <div style={{ fontWeight: 600, color: "#F0F6FC", fontSize: 13 }}>
              {val || record.category_name || "Liability"}
            </div>
            {typeLabel && (
              <div style={{ fontSize: 11, color: "#8B949E" }}>{typeLabel}</div>
            )}
          </div>
        );
      },
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      showSearch: true,
      showSorter: true,
      render: (val, record) => {
        const details = record.details || {};
        const subDetails = [];
        if (details.due_date) subDetails.push(`Due day: ${details.due_date}`);
        if (details.tenor) subDetails.push(`${details.tenor} mos`);
        if (details.monthly_installment)
          subDetails.push(`Installment: ${formatRupiah(details.monthly_installment, isPrivacyMode)}`);

        return (
          <div
            style={{ cursor: "pointer" }}
            onClick={() => navigate(`/liabilities/${record.id}`)}
          >
            <div
              style={{
                fontWeight: 600,
                color: "#38BDF8",
                fontSize: 13,
              }}
            >
              {val}
            </div>
            {subDetails.length > 0 && (
              <div style={{ fontSize: 11, color: "#8B949E", marginTop: 2 }}>
                {subDetails.join(" • ")}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Principal Amount",
      dataIndex: "principal_amount",
      key: "principal_amount",
      showSorter: true,
      align: "right",
      width: "18%",
      render: (val) => (
        <span style={{ color: "#C9D1D9", fontWeight: 500, fontSize: 13 }}>
          {formatRupiah(val, isPrivacyMode)}
        </span>
      ),
    },
    {
      title: "Remaining Balance",
      dataIndex: "remaining_balance",
      key: "remaining_balance",
      showSorter: true,
      align: "right",
      width: "20%",
      render: (val) => (
        <span
          style={{
            fontWeight: 700,
            color: Number(val) > 0 ? "#F43F5E" : "#10B981",
            fontSize: 13,
          }}
        >
          {formatRupiah(val, isPrivacyMode)}
        </span>
      ),
    },
    {
      title: "Status",
      key: "status",
      dataIndex: "remaining_balance",
      showSorter: true,
      align: "center",
      width: "12%",
      render: (val) => {
        const isActive = Number(val) > 0;
        return (
          <Tag
            style={{
              background: isActive
                ? "rgba(245, 158, 11, 0.12)"
                : "rgba(16, 185, 129, 0.12)",
              borderColor: isActive
                ? "rgba(245, 158, 11, 0.3)"
                : "rgba(16, 185, 129, 0.3)",
              color: isActive ? "#F59E0B" : "#10B981",
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 6,
              padding: "2px 8px",
            }}
          >
            {isActive ? "Active" : "Paid"}
          </Tag>
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
          <Tooltip title="Edit Liability">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: "#8B949E" }} />}
              onClick={() => navigate(`/liabilities/${record.id}`)}
              style={{ width: 28, height: 28, padding: 0 }}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this liability?"
            description="This action cannot be undone."
            onConfirm={(e) => handleDelete(record.id, e)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              style={{ width: 28, height: 28, padding: 0 }}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Modern Mobile Card View
  const renderMobileItem = (record) => {
    const details = record.details || {};
    const isActive = Number(record.remaining_balance) > 0;

    const subDetails = [];
    if (details.due_date) subDetails.push(`Due: Tgl ${details.due_date}`);
    if (details.monthly_installment)
      subDetails.push(
        `Cicilan: ${formatRupiah(details.monthly_installment, isPrivacyMode)}`
      );
    if (details.tenor) subDetails.push(`${details.tenor} bln`);
    if (details.interest_rate_pa)
      subDetails.push(`Bunga: ${details.interest_rate_pa}%`);

    const subInfo = subDetails.join(" • ");

    return (
      <div
        key={record.id || record.key}
        onClick={() => navigate(`/liabilities/${record.id}`)}
        style={{
          background: "#161B22",
          border: "1px solid #21262D",
          borderRadius: 14,
          padding: "14px 16px",
          marginBottom: 10,
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
        }}
      >
        {/* Top row: Name/Category and Balance */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div
              style={{
                color: "#F0F6FC",
                fontWeight: 700,
                fontSize: 14,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {record.name}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#8B949E",
                marginTop: 2,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ color: "#C9D1D9", fontWeight: 500 }}>
                {record.category || record.category_name || "Liability"}
              </span>
              {subInfo && (
                <>
                  <span>•</span>
                  <span
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 160,
                    }}
                  >
                    {subInfo}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Balance on right */}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: isActive ? "#F43F5E" : "#10B981",
                letterSpacing: "-0.2px",
              }}
            >
              {formatRupiah(record.remaining_balance, isPrivacyMode)}
            </div>
            {record.principal_amount > 0 && (
              <div style={{ fontSize: 10, color: "#8B949E", marginTop: 2 }}>
                Plafon: {formatRupiah(record.principal_amount, isPrivacyMode)}
              </div>
            )}
          </div>
        </div>

        {/* Bottom row: Status Tag & Action Buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #21262D",
            paddingTop: 8,
            marginTop: 6,
          }}
        >
          <Tag
            style={{
              background: isActive
                ? "rgba(245, 158, 11, 0.12)"
                : "rgba(16, 185, 129, 0.12)",
              borderColor: isActive
                ? "rgba(245, 158, 11, 0.3)"
                : "rgba(16, 185, 129, 0.3)",
              color: isActive ? "#F59E0B" : "#10B981",
              fontSize: 10,
              fontWeight: 600,
              borderRadius: 6,
              margin: 0,
              padding: "1px 6px",
            }}
          >
            {isActive ? "Active" : "Paid"}
          </Tag>

          <div
            style={{ display: "flex", alignItems: "center", gap: 6 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ fontSize: 13, color: "#8B949E" }} />}
              onClick={() => navigate(`/liabilities/${record.id}`)}
              style={{ width: 28, height: 28, padding: 0 }}
            />
            <Popconfirm
              title="Delete this liability?"
              description="This action cannot be undone."
              onConfirm={(e) => handleDelete(record.id, e)}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined style={{ fontSize: 13 }} />}
                style={{ width: 28, height: 28, padding: 0 }}
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

      {/* KPI Summary Card Header */}
      <Row gutter={[16, 16]} style={{ marginBottom: isMobile ? "12px" : "16px" }}>
        <Col span={24}>
          <Card
            variant="borderless"
            style={{
              background: "linear-gradient(135deg, #161B22 0%, #0D1117 100%)",
              border: "1px solid #21262D",
              borderRadius: 14,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
            }}
            styles={{
              body: {
                padding: isMobile ? "14px 16px" : "18px 22px",
              },
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: isMobile ? 11 : 12,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "#8B949E",
                    letterSpacing: "0.5px",
                  }}
                >
                  Total Liabilities
                </div>
                <div
                  style={{
                    fontSize: isMobile ? 22 : 28,
                    fontWeight: 800,
                    color: "#F43F5E",
                    marginTop: 4,
                    letterSpacing: "-0.5px",
                  }}
                >
                  {formatRupiah(kpiData.totalLiabilities, isPrivacyMode)}
                </div>
              </div>

              <div
                style={{
                  width: isMobile ? 38 : 46,
                  height: isMobile ? 38 : 46,
                  borderRadius: 12,
                  background: "rgba(244, 63, 94, 0.12)",
                  border: "1px solid rgba(244, 63, 94, 0.3)",
                  color: "#F43F5E",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isMobile ? 18 : 22,
                }}
              >
                <CreditCardOutlined />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filter & Action Toolbar */}
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
          marginBottom: isMobile ? "12px" : "16px",
          gap: "10px",
        }}
      >
        {/* Left Side: Status Segmented & Category Select & Sort */}
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
              { label: "Active", value: "active" },
              { label: "Paid", value: "paid" },
              { label: "All", value: "all" },
            ]}
            value={filterStatus}
            onChange={setFilterStatus}
            style={{
              background: "#0D1117",
              border: "1px solid #21262D",
              padding: "3px",
              borderRadius: "8px",
            }}
          />

          {categories.length > 0 && (
            <Select
              value={selectedCategory}
              onChange={setSelectedCategory}
              style={{
                width: isMobile ? "100%" : 160,
              }}
              popupMatchSelectWidth={false}
              dropdownStyle={{ background: "#161B22", borderColor: "#30363D" }}
              options={[
                { label: "All Categories", value: "all" },
                ...categories.map((c) => ({
                  label: c.name,
                  value: c.id,
                })),
              ]}
            />
          )}

          <Select
            value={sortOption}
            onChange={setSortOption}
            style={{
              width: isMobile ? "100%" : 150,
            }}
            popupMatchSelectWidth={false}
            dropdownStyle={{ background: "#161B22", borderColor: "#30363D" }}
            options={SORT_OPTIONS}
          />
        </div>

        {/* Right Side: Search Input & Add Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            width: isMobile ? "100%" : "auto",
          }}
        >
          <Input
            prefix={<SearchOutlined style={{ color: "#8B949E" }} />}
            placeholder="Search..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            allowClear
            style={{
              flex: 1,
              minWidth: isMobile ? "auto" : 200,
              background: "#0D1117",
              borderColor: "#21262D",
              borderRadius: 8,
              color: "#F0F6FC",
            }}
          />

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/liabilities/add")}
            style={{
              background: "linear-gradient(90deg, #2563EB 0%, #38BDF8 100%)",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              boxShadow: "0 0 10px rgba(37, 99, 235, 0.4)",
              flexShrink: 0,
            }}
          >
            Add
          </Button>
        </div>
      </div>

      {/* Main Listing: Mobile Card View or Desktop Table */}
      <ListingTable
        key={refreshTrigger}
        columns={columns}
        endpoint="/v1/liabilities"
        extraParams={extraParams}
        renderMobileItem={renderMobileItem}
      />
    </>
  );
}
