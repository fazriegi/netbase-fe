import { Form, App as AntdApp } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AssetForm from "src/components/modules/assets/AssetForm";
import api from "src/pkg/api";
import { ExclamationCircleFilled } from "@ant-design/icons";

export default function AssetEdit() {
  const [form] = Form.useForm();
  const { message, modal } = AntdApp.useApp();

  const { id } = useParams();

  const [isSubmit, setIsSubmit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const onFinish = async (formData) => {
    setIsSubmit(true);
    try {
      const response = await api.put(`/v1/assets/${id}`, formData);

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

  const onDelete = () => {
    modal.confirm({
      title: "Are you sure you want to delete this asset?",
      icon: <ExclamationCircleFilled />,
      content: "This action cannot be undone.",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk: handleDelete,
    });
  };

  const handleDelete = async () => {
    setIsSubmit(true);
    try {
      const response = await api.delete(`/v1/assets/${id}`);

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

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/v1/assets/${id}`);

      const respBody = response?.data;
      if (respBody?.is_success) {
        const data = respBody.data;
        if (data.category_type === "physical" && data.details?.purchase_year) {
          data.details.purchase_year = dayjs(data.details.purchase_year.toString());
        }
        form.setFieldsValue(data);
      }
    } catch (err) {
      const apiStatus = err?.response?.data?.status;
      const apiMessage = err?.response?.data?.message;

      if (apiStatus && apiMessage) {
        message.error(apiMessage);
        return;
      }

      message.error(err?.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <AssetForm
      onFinish={onFinish}
      isSubmit={isSubmit}
      isLoading={isLoading}
      form={form}
      type="edit"
      onDelete={onDelete}
    />
  );
}
