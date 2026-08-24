import { useState, useMemo } from "react";
import { Button, Tag, theme, Segmented } from "antd";
import numeral from "numeral";
import { PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import ListingTable from "src/components/ListingTable";
import PageHeader from "src/components/PageHeader";

export default function LiabilityPage() {
  const {
    token: { colorPrimary },
  } = theme.useToken();

  const [filterStatus, setFilterStatus] = useState("active");

  const extraParams = useMemo(() => {
    if (filterStatus === "active") return { is_active: true };
    if (filterStatus === "paid") return { is_active: false };
    return {};
  }, [filterStatus]);

  const columns = [
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      showSearch: true,
      showSorter: true,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      showSearch: true,
      showSorter: true,
      render: (_, record) => (
        <span
          style={{ cursor: "pointer", color: colorPrimary }}
          onClick={() => navigate(`/liabilities/${record.id}`)}
        >
          {record.name}
        </span>
      ),
    },
    {
      title: "Remaining Balance",
      dataIndex: "remaining_balance",
      key: "remaining_balance",
      showSorter: true,
      align: "right",
      render: (_, record) => numeral(record.remaining_balance).format("0,0"),
    },
    {
      title: "Status",
      key: "status",
      dataIndex: "remaining_balance",
      showSorter: true,
      align: "center",
      width: "15%",
      render: (_, record) => {
        const isActive = Number(record.remaining_balance) > 0;
        return (
          <Tag color={isActive ? "warning" : "success"}>
            {isActive ? "Active" : "Paid"}
          </Tag>
        );
      },
    },
  ];

  const navigate = useNavigate();

  const handleAdd = () => {
    navigate("/liabilities/add");
  };

  return (
    <>
      <PageHeader breadCrumb={["Liabilities"]} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1em",
          flexWrap: "wrap",
          gap: "1em",
        }}
      >
        <Segmented
          options={[
            { label: "Active", value: "active" },
            { label: "Paid", value: "paid" },
            { label: "All", value: "all" },
          ]}
          value={filterStatus}
          onChange={setFilterStatus}
          style={{
            padding: "4px",
            borderRadius: "8px",
          }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add
        </Button>
      </div>

      <ListingTable
        columns={columns}
        endpoint="/v1/liabilities"
        extraParams={extraParams}
      />
    </>
  );
}
