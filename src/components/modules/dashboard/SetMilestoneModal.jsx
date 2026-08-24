import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Radio,
  Button,
  Typography,
  Alert,
} from "antd";
import {
  RocketOutlined,
  AimOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import confetti from "canvas-confetti";
import { formatRupiah } from "src/pkg/helper";

const { Text } = Typography;

const PRESET_MILESTONES = [
  {
    key: "breakeven",
    label: "Break-Even (Rp 0)",
    amount: 0,
    title: "Path to Break-Even",
  },
  {
    key: "10m",
    label: "First 10M",
    amount: 10000000,
    title: "First Rp 10M Milestone",
  },
  {
    key: "25m",
    label: "First 25M",
    amount: 25000000,
    title: "First Rp 25M Milestone",
  },
  {
    key: "50m",
    label: "First 50M",
    amount: 50000000,
    title: "First Rp 50M Milestone",
  },
  {
    key: "100m",
    label: "First 100M",
    amount: 100000000,
    title: "First Rp 100M Milestone",
  },
  {
    key: "custom",
    label: "Custom Target",
    amount: null,
    title: "",
  },
];

export default function SetMilestoneModal({
  open,
  onClose,
  onSave,
  currentMilestone,
  currentNetWorth = 0,
}) {
  const [form] = Form.useForm();
  const [selectedPreset, setSelectedPreset] = useState("breakeven");
  const [targetAmountVal, setTargetAmountVal] = useState(0);

  const syncFormValues = () => {
    const rawTarget =
      currentMilestone?.target_amount !== undefined && currentMilestone?.target_amount !== null
        ? Number(currentMilestone.target_amount)
        : currentMilestone?.targetAmount !== undefined && currentMilestone?.targetAmount !== null
          ? Number(currentMilestone.targetAmount)
          : undefined;

    if (rawTarget !== undefined) {
      const match = PRESET_MILESTONES.find((p) => p.amount === rawTarget);
      setSelectedPreset(match ? match.key : "custom");
      setTargetAmountVal(rawTarget);

      form.setFieldsValue({
        title:
          currentMilestone?.title ||
          (rawTarget === 0 ? "Path to Break-Even" : "First Rp 10M"),
        targetAmount: rawTarget,
      });
    } else {
      const defaultPreset =
        currentNetWorth < 0
          ? PRESET_MILESTONES[0]
          : PRESET_MILESTONES.find(
            (p) => p.amount !== null && p.amount > currentNetWorth
          ) || PRESET_MILESTONES[1];

      setSelectedPreset(defaultPreset.key);
      setTargetAmountVal(defaultPreset.amount);

      form.setFieldsValue({
        title: defaultPreset.title,
        targetAmount: defaultPreset.amount,
      });
    }
  };

  const handlePresetChange = (e) => {
    const key = e.target.value;
    setSelectedPreset(key);

    const preset = PRESET_MILESTONES.find((p) => p.key === key);
    if (preset && preset.key !== "custom") {
      form.setFieldsValue({
        title: preset.title,
        targetAmount: preset.amount,
      });
      setTargetAmountVal(preset.amount);
    } else if (preset && preset.key === "custom") {
      form.setFieldsValue({
        title: form.getFieldValue("title") || "New Financial Goal",
      });
    }
  };

  const handleFinish = (values) => {
    const targetAmt = Number(values.targetAmount);
    const newMilestone = {
      title:
        values.title?.trim() ||
        (targetAmt === 0 ? "Path to Break-Even" : "Financial Goal"),
      target_amount: targetAmt,
      targetAmount: targetAmt,
    };

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#38BDF8", "#10B981", "#F59E0B"],
      });
    } catch {
      // ignore
    }

    onSave(newMilestone);
    onClose();
  };

  const isTargetInvalid =
    targetAmountVal !== null &&
    targetAmountVal !== undefined &&
    targetAmountVal <= currentNetWorth;

  return (
    <Modal
      title={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            paddingBottom: 4,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(56, 189, 248, 0.15)",
              color: "#38BDF8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            <TrophyOutlined />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#F0F6FC" }}>
              Set New Milestone
            </div>
            <div style={{ fontSize: 12, color: "#8B949E", fontWeight: 400 }}>
              Set your next net worth goal to track financial growth
            </div>
          </div>
        </div>
      }
      open={open}
      afterOpenChange={(isOpen) => {
        if (isOpen) syncFormValues();
      }}
      destroyOnClose
      onCancel={onClose}
      footer={null}
      centered
      width={520}
      styles={{
        content: {
          background: "#161B22",
          border: "1px solid #30363D",
          borderRadius: 16,
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
        },
        header: {
          background: "transparent",
          borderBottom: "1px solid #21262D",
          paddingBottom: 12,
        },
      }}
    >
      <div style={{ paddingTop: 16 }}>
        {/* Preset Fast-Picks */}
        <div style={{ marginBottom: 18 }}>
          <Text
            strong
            style={{
              display: "block",
              color: "#8B949E",
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: 8,
            }}
          >
            Preset Targets
          </Text>

          <Radio.Group
            value={selectedPreset}
            onChange={handlePresetChange}
            style={{
              width: "100%",
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 8,
            }}
          >
            {PRESET_MILESTONES.map((preset) => (
              <Radio.Button
                key={preset.key}
                value={preset.key}
                style={{
                  height: "auto",
                  padding: "8px 12px",
                  borderRadius: 8,
                  background:
                    selectedPreset === preset.key
                      ? "rgba(37, 99, 235, 0.2)"
                      : "#0D1117",
                  borderColor:
                    selectedPreset === preset.key ? "#2563EB" : "#21262D",
                  color: selectedPreset === preset.key ? "#38BDF8" : "#C9D1D9",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  lineHeight: 1.2,
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 13 }}>
                  {preset.label}
                </span>
                {preset.amount !== null ? (
                  <span style={{ fontSize: 11, color: "#8B949E", marginTop: 2 }}>
                    {formatRupiah(preset.amount, false)}
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: "#8B949E", marginTop: 2 }}>
                    Custom
                  </span>
                )}
              </Radio.Button>
            ))}
          </Radio.Group>
        </div>

        {/* Input Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
            title: "Path to Break-Even",
            targetAmount: 0,
          }}
        >
          <Form.Item
            label={
              <span style={{ color: "#C9D1D9", fontWeight: 600 }}>
                Target Name
              </span>
            }
            name="title"
            rules={[
              { required: true, message: "Please enter a target milestone name" },
            ]}
          >
            <Input
              prefix={<AimOutlined style={{ color: "#8B949E" }} />}
              placeholder="e.g. Path to Break-Even, First Rp 10M, Emergency Fund"
              style={{
                background: "#0D1117",
                borderColor: "#21262D",
                color: "#F0F6FC",
                height: 40,
                borderRadius: 8,
              }}
            />
          </Form.Item>

          <Form.Item
            label={
              <span style={{ color: "#C9D1D9", fontWeight: 600 }}>
                Target Amount (Rp)
              </span>
            }
            name="targetAmount"
            rules={[
              { required: true, message: "Please enter a target amount" },
              {
                validator: (_, value) => {
                  if (
                    value !== undefined &&
                    value !== null &&
                    value <= currentNetWorth
                  ) {
                    return Promise.reject(
                      new Error(
                        `Target must be greater than current Net Worth (${formatRupiah(
                          currentNetWorth,
                          false
                        )})`
                      )
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              style={{
                width: "100%",
                background: "#0D1117",
                borderColor: "#21262D",
                color: "#F0F6FC",
                height: 40,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
              }}
              prefix={
                <span
                  style={{
                    color: "#10B981",
                    fontWeight: 700,
                    marginRight: 6,
                  }}
                >
                  Rp
                </span>
              }
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
              }
              parser={(value) => value.replace(/\$\s?|(\.*)/g, "")}
              onChange={(val) => setTargetAmountVal(val)}
              min={0}
            />
          </Form.Item>

          {isTargetInvalid && (
            <Alert
              type="warning"
              showIcon
              message={
                <span style={{ fontSize: 12 }}>
                  Selected target ({formatRupiah(targetAmountVal, false)}) must
                  be greater than current Net Worth (
                  {formatRupiah(currentNetWorth, false)}).
                </span>
              }
              style={{
                marginBottom: 16,
                background: "rgba(245, 158, 11, 0.1)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
              }}
            />
          )}

          {/* Footer Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              paddingTop: 12,
              borderTop: "1px solid #21262D",
            }}
          >
            <Button
              onClick={onClose}
              style={{
                background: "#21262D",
                borderColor: "#30363D",
                color: "#C9D1D9",
                height: 38,
                borderRadius: 8,
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<RocketOutlined />}
              style={{
                background:
                  "linear-gradient(135deg, #06B6D4 0%, #10B981 100%)",
                border: "none",
                color: "#FFFFFF",
                fontWeight: 700,
                height: 38,
                borderRadius: 8,
                boxShadow: "0 0 12px rgba(6, 182, 212, 0.4)",
              }}
            >
              Save Milestone
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
}
