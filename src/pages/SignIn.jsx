import { Button, Form, Grid, Input, message, Space, Typography } from "antd";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GlassCard from "src/components/GlassCard";
import api from "src/pkg/api";
import { APP_NAME } from "src/pkg/constant";

const { useBreakpoint } = Grid;

export default function SignIn() {
  const [form] = Form.useForm();
  const screens = useBreakpoint();

  const [isSubmit, setIsSubmit] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (formData) => {
    setIsSubmit(true);
    try {
      const response = await api.post("/v1/login", formData);

      const respBody = response?.data;

      if (respBody?.is_success) {
        localStorage.setItem("USER", JSON.stringify(respBody?.data?.user));
        message.success(respBody?.message);
        navigate("/");
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
    <div className="auth-wrapper">
      <GlassCard
        style={
          screens.sm
            ? { padding: "4em", width: "30em" }
            : { padding: "3em", width: "100%" }
        }
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: "1.5em",
          }}
        >
          <img
            src="/logo.svg"
            alt="NetBase Logo"
            style={{ width: 64, height: 64, marginBottom: "0.5em" }}
          />
          <Typography.Title
            level={2}
            style={{
              margin: 0,
              fontWeight: 600,
              background: "linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {APP_NAME}
          </Typography.Title>
          <Typography.Text type="secondary" style={{ marginTop: "0.25em" }}>
            Welcome back! Please login to your account.
          </Typography.Text>
        </div>
        <Form
          name="login"
          style={{ marginTop: "2em" }}
          layout="vertical"
          onFinish={onFinish}
          form={form}
        >
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Username required!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password />
          </Form.Item>
          <Space vertical style={{ width: "100%", textAlign: "center" }}>
            <Typography.Text>
              New here? <Link to="/signup">Create an account!</Link>
            </Typography.Text>
            <Button
              type="primary"
              htmlType="submit"
              style={{ marginTop: "2em" }}
              loading={isSubmit}
              block
            >
              Login
            </Button>
          </Space>
        </Form>
      </GlassCard>
    </div>
  );
}
