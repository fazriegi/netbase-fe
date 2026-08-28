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
  WalletOutlined,
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
  { label: "Highest Value", value: "current_value desc" },
  { label: "Lowest Value", value: "current_value asc" },
  { label: "Name (A-Z)", value: "name asc" },
  { label: "Name (Z-A)", value: "name desc" },
];

export default function Asset() {
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
  const [summaryData, setSummaryData] = useState({ totalValue: 0, count: 0 });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch Category options for filter
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/v1/assets/categories");
        const respBody = res?.data;
        const list = respBody?.data || respBody || [];
        if (Array.isArray(list)) {
          setCategories(list);
        }
      } catch {
        // Fallback silently if categories endpoint is unavailable
      }
    };
    fetchCategories();
  }, []);

  const extraParams = useMemo(() => {
    const params = {};

    if (filterStatus === "active") params.is_active = true;
    if (filterStatus === "inactive") params.is_active = false;

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

  // Fetch Summary based on current active filters
  const fetchSummary = useCallback(async () => {
    try {
      const params = {
        limit: 1000,
        page: 1,
        ...extraParams,
      };
      const res = await api.get("/v1/assets", { params });
      const respData = res?.data?.data || [];
      const totalCount = res?.data?.pagination_meta?.total ?? respData.length;
      const total = respData.reduce(
        (sum, item) => sum + Number(item.current_value || 0),
        0
      );

      setSummaryData({
        totalValue: total,
        count: totalCount,
      });
    } catch {
      // Fallback
    }
  }, [extraParams]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary, refreshTrigger]);

  const summaryTitle = useMemo(() => {
    if (searchKeyword && searchKeyword.trim()) {
      return "Filtered Assets Value";
    }

    if (selectedCategory && selectedCategory !== "all") {
      const catObj = categories.find((c) => c.id === selectedCategory);
      if (catObj?.name) {
        return `Total ${catObj.name} Assets`;
      }
      return "Filtered Assets Value";
    }

    if (filterStatus === "active") return "Total Active Assets";
    if (filterStatus === "inactive") return "Total Inactive Assets";
    return "Total Assets";
  }, [searchKeyword, selectedCategory, categories, filterStatus]);

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const response = await api.delete(`/v1/assets/${id}`);
      const respBody = response?.data;
      if (respBody?.is_success || response?.status === 200) {
        message.success(respBody?.message || "Asset deleted successfully");
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err) {
      const apiMessage =
        err?.response?.data?.message || err?.message || "Failed to delete asset";
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
      width: "22%",
      render: (val, record) => {
        return (
          <div>
            <div style={{ fontWeight: 600, color: "#F0F6FC", fontSize: 13 }}>
              {val || record.category_name || "Asset"}
            </div>
            {record.category_type && (
              <div style={{ fontSize: 11, color: "#8B949E", textTransform: "capitalize" }}>
                {record.category_type}
              </div>
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
        const extraLabel =
          details.ticker_symbol ||
          details.platform_name ||
          details.account_name ||
          details.model ||
          "";

        return (
          <div
            style={{ cursor: "pointer" }}
            onClick={() => navigate(`/assets/${record.id}`)}
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
            {extraLabel && (
              <div style={{ fontSize: 11, color: "#8B949E", marginTop: 2 }}>
                {extraLabel}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Current Value",
      dataIndex: "current_value",
      key: "current_value",
      showSorter: true,
      align: "right",
      width: "22%",
      render: (val) => (
        <span
          style={{
            fontWeight: 700,
            color: "#10B981",
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
      dataIndex: "is_active",
      showSorter: true,
      align: "center",
      width: "12%",
      render: (isActive) => (
        <Tag
          style={{
            background: isActive ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
            borderColor: isActive ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)",
            color: isActive ? "#10B981" : "#EF4444",
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 6,
            padding: "2px 8px",
          }}
        >
          {isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      width: "12%",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit Asset">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: "#8B949E" }} />}
              onClick={() => navigate(`/assets/${record.id}`)}
              style={{ width: 28, height: 28, padding: 0 }}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this asset?"
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

  // Modern Mobile Card View without emojis
  const renderMobileItem = (record) => {
    const details = record.details || {};
    const platform = details.platform_name || "";
    const ticker = details.ticker_symbol || "";
    const quantity = details.quantity ? `${details.quantity} units` : "";
    const model = details.model || "";
    const account = details.account_name || "";

    const subInfo = [platform, ticker, model, account, quantity]
      .filter(Boolean)
      .join(" • ");

    return (
      <div
        key={record.id || record.key}
        onClick={() => navigate(`/assets/${record.id}`)}
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
        {/* Top row: Name/Category and Value */}
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
                {record.category || record.category_name || "Asset"}
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

          {/* Asset Value on right */}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#10B981",
                letterSpacing: "-0.2px",
              }}
            >
              {formatRupiah(record.current_value, isPrivacyMode)}
            </div>
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
              background: record.is_active
                ? "rgba(16, 185, 129, 0.12)"
                : "rgba(239, 68, 68, 0.12)",
              borderColor: record.is_active
                ? "rgba(16, 185, 129, 0.3)"
                : "rgba(239, 68, 68, 0.3)",
              color: record.is_active ? "#10B981" : "#EF4444",
              fontSize: 10,
              fontWeight: 600,
              borderRadius: 6,
              margin: 0,
              padding: "1px 6px",
            }}
          >
            {record.is_active ? "Active" : "Inactive"}
          </Tag>

          <div
            style={{ display: "flex", alignItems: "center", gap: 6 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ fontSize: 13, color: "#8B949E" }} />}
              onClick={() => navigate(`/assets/${record.id}`)}
              style={{ width: 28, height: 28, padding: 0 }}
            />
            <Popconfirm
              title="Delete this asset?"
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
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span>{summaryTitle}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#6E7681",
                      textTransform: "none",
                    }}
                  >
                    ({summaryData.count} item{summaryData.count !== 1 ? "s" : ""})
                  </span>
                </div>
                <div
                  style={{
                    fontSize: isMobile ? 22 : 28,
                    fontWeight: 800,
                    color: "#10B981",
                    marginTop: 4,
                    letterSpacing: "-0.5px",
                  }}
                >
                  {formatRupiah(summaryData.totalValue, isPrivacyMode)}
                </div>
              </div>

              <div
                style={{
                  width: isMobile ? 38 : 46,
                  height: isMobile ? 38 : 46,
                  borderRadius: 12,
                  background: "rgba(16, 185, 129, 0.12)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  color: "#10B981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isMobile ? 18 : 22,
                }}
              >
                <WalletOutlined />
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
        {/* Left Side: Status Segmented & Category Select */}
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
              { label: "Inactive", value: "inactive" },
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
            onClick={() => navigate("/assets/add")}
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
        endpoint="/v1/assets"
        extraParams={extraParams}
        renderMobileItem={renderMobileItem}
      />
    </>
  );
}
