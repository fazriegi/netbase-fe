import { useState, useMemo } from "react";
import { Button, Tag, theme, Segmented } from "antd";
import numeral from "numeral";
import { PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import ListingTable from "src/components/ListingTable";
import PageHeader from "src/components/PageHeader";

export default function Asset() {
  const {
    token: { colorPrimary },
  } = theme.useToken();

  const [filterStatus, setFilterStatus] = useState("active");

  const extraParams = useMemo(() => {
    if (filterStatus === "active") return { is_active: true };
    if (filterStatus === "inactive") return { is_active: false };
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
          onClick={() => navigate(`/assets/${record.id}`)}
        >
          {record.name}
        </span>
      ),
    },
    {
      title: "Current Value",
      dataIndex: "current_value",
      key: "current_value",
      showSorter: true,
      align: "right",
      render: (_, record) => numeral(record.current_value).format("0,0"),
    },
    {
      title: "Status",
      key: "status",
      dataIndex: "is_active",
      showSorter: true,
      align: "center",
      width: "10%",
      render: (_, { is_active }) => {
        const colorMap = {
          true: "green",
          false: "red",
          archived: "default",
        };

        return (
          <Tag color={colorMap[is_active] || "default"}>
            {is_active ? "Active" : "Inactive"}
          </Tag>
        );
      },
    },
  ];

  const navigate = useNavigate();

  const handleAdd = () => {
    navigate("/assets/add");
  };

  return (
    <>
      <PageHeader />
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
            { label: "Inactive", value: "inactive" },
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
        endpoint="/v1/assets"
        extraParams={extraParams}
      />
    </>
  );
}
