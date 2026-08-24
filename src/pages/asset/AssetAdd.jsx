import { Form, App as AntdApp } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AssetForm from "src/components/modules/assets/AssetForm";
import api from "src/pkg/api";

export default function AssetAdd() {
  const [form] = Form.useForm();
  const { message } = AntdApp.useApp();

  const [isSubmit, setIsSubmit] = useState(false);

  const navigate = useNavigate();

  const onFinish = async (formData) => {
    setIsSubmit(true);
    try {
      const response = await api.post("/v1/assets", formData);

      const respBody = response?.data;

      if (respBody?.is_success) {
        message.success(respBody?.message);
        navigate("/assets");
      }
    } catch (err) {
      const apiMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong. Please try again.";

      message.error(apiMessage);
    } finally {
      setIsSubmit(false);
    }
  };

  return (
    <AssetForm
      onFinish={onFinish}
      isSubmit={isSubmit}
      form={form}
    />
  );
}
