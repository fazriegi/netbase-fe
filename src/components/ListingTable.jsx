import { Button, Input, message, Space, theme, Grid, Spin } from "antd";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import qs from "qs";
import SimpleTable from "./SimpleTable";
import api from "src/pkg/api";
import { SearchOutlined } from "@ant-design/icons";

const getApiParam = (params) => ({
  limit: params.pagination?.pageSize || params.limit,
  page: params.pagination?.current || params.page,
  ...params,
});

function ListingTable({ endpoint, columns, extraParams, renderMobileItem, ...props }) {
  const screens = Grid.useBreakpoint();
  const isMobile = screens.sm === false;
  const {
    token: { colorPrimary },
  } = theme.useToken();

  const initialPagination = {
    limit: 10,
    page: 1,
    total: 0,
  };

  const [fetchingData, setFetchingData] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [dataList, setDataList] = useState([]);
  const [tableParams, setTableParams] = useState(initialPagination);
  const [columnSearch, setColumnSearch] = useState({});

  const searchInput = useRef(null);
  const sentinelRef = useRef(null);

  const getData = async (params = tableParams, isAppend = false) => {
    try {
      if (isAppend) {
        setFetchingMore(true);
      } else {
        setFetchingData(true);
      }

      const apiParams = {
        ...getApiParam(params),
        ...extraParams,
      };

      delete apiParams["total"];

      const res = await api.get(`${endpoint}?${qs.stringify(apiParams)}`);

      const respData = res?.data?.data || [];
      const totalCount = res?.data?.pagination_meta?.total ?? 0;

      if (isAppend) {
        setDataList((prev) => [
          ...prev,
          ...respData.map((obj, idx) => ({
            ...obj,
            key: `${prev.length + idx + 1}`,
          })),
        ]);
      } else {
        const data = respData.map((obj, idx) => ({
          ...obj,
          key: `${idx + 1}`,
        }));
        setDataList(data);
      }

      setTableParams((prev) => ({
        ...prev,
        page: params.page || 1,
        total: totalCount,
      }));
    } catch (err) {
      const apiMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong. Please try again.";

      message.error(apiMessage);
    } finally {
      setFetchingData(false);
      setFetchingMore(false);
    }
  };

  const hasMore = dataList.length < tableParams.total;

  const loadMore = useCallback(() => {
    if (fetchingData || fetchingMore || !hasMore) return;
    const nextPage = tableParams.page + 1;
    const nextParams = { ...tableParams, page: nextPage };
    getData(nextParams, true);
  }, [fetchingData, fetchingMore, hasMore, tableParams, extraParams, endpoint]);

  // Infinite scroll IntersectionObserver on mobile
  useEffect(() => {
    if (!isMobile || !renderMobileItem) return;
    if (!hasMore || fetchingData || fetchingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "120px" }
    );

    const currentEl = sentinelRef.current;
    if (currentEl) {
      observer.observe(currentEl);
    }

    return () => {
      if (currentEl) observer.unobserve(currentEl);
    };
  }, [isMobile, renderMobileItem, hasMore, fetchingData, fetchingMore, loadMore]);

  const handleTableChange = (pagination, filters, sorter) => {
    const sortArray = Array.isArray(sorter) ? sorter : [sorter];

    const sort = sortArray
      .filter((s) => s && s.field && s.order)
      .map((s) => `${s.field} ${s.order === "ascend" ? "asc" : "desc"}`)
      .join(", ");

    const cleanFilters = {};
    Object.keys(filters || {}).forEach((key) => {
      if (filters[key]?.length) {
        cleanFilters[key] = filters[key][0];
      }
    });

    const newParams = {
      page: pagination.current,
      limit: pagination.pageSize,
      ...cleanFilters,
    };

    if (sort !== "") newParams["sort"] = sort;

    setTableParams((prev) => ({
      ...prev,
      ...newParams,
    }));
    getData(newParams);
  };

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setColumnSearch((prev) => ({
      ...prev,
      [dataIndex]: selectedKeys[0] || "",
    }));
  };

  const handleReset = (clearFilters, dataIndex) => {
    clearFilters();
    setColumnSearch((prev) => {
      const newState = { ...prev };
      delete newState[dataIndex];
      return newState;
    });

    getData(initialPagination);
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0] || ""}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8 }}
        />

        <Space>
          <Button
            type="primary"
            size="small"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
          >
            Search
          </Button>
          <Button
            size="small"
            onClick={() => handleReset(clearFilters, dataIndex)}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),

    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? colorPrimary : undefined }} />
    ),

    filteredValue: columnSearch[dataIndex] ? [columnSearch[dataIndex]] : null,
  });

  useEffect(() => {
    const newParams = { ...tableParams, page: 1 };
    setTableParams(newParams);
    getData(newParams);
  }, [JSON.stringify(extraParams)]);

  const cols = useMemo(() => {
    const colsCopy = [...columns];

    const hasNoColumn = colsCopy.some((col) => col.dataIndex === "no.");

    if (!hasNoColumn) {
      colsCopy.unshift({
        title: "No.",
        dataIndex: "no.",
        key: "no.",
        width: 40,
        fixed: "left",
        align: "center",
        render: (_, __, index) =>
          `${(tableParams.page - 1) * tableParams.limit + index + 1}.`,
      });
    }

    return colsCopy.map((col, idx) => {
      const newCol = { ...col };

      if (col?.showSearch && col.dataIndex) {
        Object.assign(newCol, getColumnSearchProps(col.dataIndex));
      }

      if (col?.showSorter && col.dataIndex) {
        newCol.sorter = { multiple: idx + 1 };
      }

      return newCol;
    });
  }, [columns, getColumnSearchProps]);

  // Mobile list view with infinite scroll
  if (isMobile && renderMobileItem) {
    return (
      <div style={props?.style}>
        {fetchingData ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin />
          </div>
        ) : dataList.length === 0 ? (
          <div
            style={{
              background: "#161B22",
              border: "1px dashed #30363D",
              borderRadius: 14,
              padding: "36px 20px",
              textAlign: "center",
              margin: "12px 0",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>💳</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#F0F6FC" }}>
              No Data Available
            </div>
            <div style={{ fontSize: 12, color: "#8B949E", marginTop: 4 }}>
              No records found for the selected filter.
            </div>
          </div>
        ) : (
          <div>
            {dataList.map((item, idx) => renderMobileItem(item, idx))}

            {/* Infinite Scroll Loading indicator or Sentinel */}
            {fetchingMore && (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <Spin size="small" />
              </div>
            )}

            {/* Invisible sentinel element for scroll-based loading */}
            {hasMore && !fetchingMore && (
              <div ref={sentinelRef} style={{ height: 20, width: "100%" }} />
            )}

            {!hasMore && dataList.length > 5 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "16px 0",
                  color: "#6E7681",
                  fontSize: 11,
                }}
              >
                All transactions loaded ({dataList.length})
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={props?.style}>
      <SimpleTable
        data={dataList}
        rowKey="key"
        bordered
        style={{ width: "100%" }}
        loading={fetchingData}
        pagination={{
          current: tableParams.page,
          pageSize: tableParams.limit,
          total: tableParams.total,
          showSizeChanger: true,
        }}
        onChange={handleTableChange}
        tableLayout="fixed"
        columns={cols}
        {...props}
      />
    </div>
  );
}

export default ListingTable;
