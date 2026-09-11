import { message, Select } from "antd";
import { useEffect, useState } from "react";
import api from "src/pkg/api";

export default function InputSelect({
  selectLabel = "",
  selectValue = "",
  datasource = "",
  listOptions = [],
  onChange,
  onDropdownVisibleChange,
  getPopupContainer,
  open: customOpen,
  ...props
}) {
  const [options, setOptions] = useState(listOptions);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fetchOptions = async () => {
    setLoading(true);
    try {
      const response = await api.get(datasource);

      const respBody = response?.data;

      if (respBody?.is_success) {
        const temp = respBody?.data?.map((item) => ({
          value: item[selectLabel],
          label: item[selectValue],
          ...item
        }));
        setOptions(temp);
      }
    } catch (err) {
      const apiMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong. Please try again.";

      message.error(apiMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (datasource !== "") {
      fetchOptions();
    }
  }, []);

  useEffect(() => {
    if (listOptions && listOptions.length > 0) {
      setOptions(listOptions);
    }
  }, [listOptions]);

  const handleDropdownVisibleChange = (openVal) => {
    setDropdownOpen(openVal);
    if (onDropdownVisibleChange) {
      onDropdownVisibleChange(openVal);
    }
  };

  const handleChange = (val, option) => {
    setDropdownOpen(false);
    if (onChange) {
      onChange(val, option);
    }
  };

  return (
    <Select
      loading={loading}
      showSearch={{ optionFilterProp: "label" }}
      options={options}
      open={customOpen !== undefined ? customOpen : dropdownOpen}
      onDropdownVisibleChange={handleDropdownVisibleChange}
      onChange={handleChange}
      getPopupContainer={getPopupContainer || ((triggerNode) => triggerNode.parentNode)}
      {...props}
    />
  );
}
