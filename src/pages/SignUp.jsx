import { Button, Form, Grid, Input, message, Space, Typography } from "antd";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GlassCard from "src/components/GlassCard";
import api from "src/pkg/api";
import { APP_NAME } from "src/pkg/constant";

const { useBreakpoint } = Grid;

export default function SignUp() {
  const [form] = Form.useForm();
  const screens = useBreakpoint();

  const [isSubmit, setIsSubmit] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (formData) => {
    setIsSubmit(true);
    try {
      const response = await api.post("/v1/register", formData);

      const respBody = response?.data;

      if (respBody?.is_success) {
        message.success(respBody?.message);
        navigate("/login");
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
            Create an account to start tracking your finances.
          </Typography.Text>
        </div>
        <Form
          name="signup-form"
          style={{ marginTop: "2em" }}
          layout="vertical"
          onFinish={onFinish}
          form={form}
        >
          <Form.Item
            label="Name"
            name="full_name"
            rules={[{ required: true, message: "Please input your name!" }]}
          >
            <Input type="text" />
          </Form.Item>
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Please input your username!" }]}
          >
            <Input type="text" />
          </Form.Item>
          <Form.Item label="Email" name="email">
            <Input type="email" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: "Please input your password!" },
              {
                validator: (_, value) => {
                  if (!value) {
                    return Promise.resolve();
                  }

                  const passwordRegex =
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[?.!@#$%^&*])[A-Za-z\d?.!@#$%^&*]{8,}$/;

                  if (passwordRegex.test(value)) {
                    return Promise.resolve();
                  }

                  return Promise.reject(
                    new Error(
                      "Password must be at least 8 characters and include uppercase, lowercase, numbers, and a special character (?.!@#$%^&*)",
                    ),
                  );
                },
              },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="Confirm Password"
            name="confirm_password"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your password!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match!"));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Space vertical style={{ width: "100%", textAlign: "center" }}>
            <Typography.Text>
              Already have an account? <Link to="/login">Login!</Link>
            </Typography.Text>
            <Button
              type="primary"
              htmlType="submit"
              style={{ marginTop: "2em" }}
              loading={isSubmit}
              block
            >
              Sign Up
            </Button>
          </Space>
        </Form>
      </GlassCard>
    </div>
  );
}
