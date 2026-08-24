import React, { useState, useEffect } from "react";
import { Tooltip, Button, Tag } from "antd";
import {
  EditOutlined,
  PlusOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import confetti from "canvas-confetti";
import SetMilestoneModal from "./SetMilestoneModal";
import { formatRupiah } from "src/pkg/helper";
import { useDashboard } from "src/context/DashboardContext";

export default function MilestoneTracker({
  milestoneData,
  currentNetWorth = 0,
  onMilestoneChange,
  compact = false,
}) {
  const { isPrivacyMode } = useDashboard();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const milestone = milestoneData || {};
  const targetAmount = Number(milestone.target_amount ?? 0);
  const baseline = Number(milestone.base_amount ?? 0);
  const isCompleted = Boolean(milestone.is_completed ?? false);

  const backendProgress =
    milestone.progress_percentage !== undefined && milestone.progress_percentage !== null
      ? Number(milestone.progress_percentage)
      : null;

  const backendRemainingGap =
    milestone.remaining_gap !== undefined && milestone.remaining_gap !== null
      ? Number(milestone.remaining_gap)
      : null;

  // Determine current financial state
  // State 1: Recovery Phase (Net Worth < 0, recovering towards Rp 0)
  // State 2: Milestone Achieved (isCompleted or Net Worth >= targetAmount)
  // State 3: Growth Phase (Net Worth >= 0 and targetAmount > currentNetWorth)
  let state = "recovery"; // 'recovery' | 'achieved' | 'growth'

  if (isCompleted) {
    state = "achieved";
  } else if (targetAmount > 0 && currentNetWorth >= targetAmount) {
    state = "achieved";
  } else if (targetAmount === 0 && currentNetWorth >= 0) {
    state = "achieved";
  } else if (currentNetWorth < 0 || targetAmount === 0) {
    state = "recovery";
  } else {
    state = "growth";
  }

  // Calculate accurate progress percentage & remaining gap
  let progressPercentage = 0;
  let gapAmount = 0;

  if (state === "achieved") {
    progressPercentage = 100;
    gapAmount = 0;
  } else if (state === "growth") {
    if (backendProgress !== null && !isNaN(backendProgress)) {
      progressPercentage = Math.min(100, Math.max(0, backendProgress));
    } else {
      const calc = targetAmount > 0 ? (Math.max(0, currentNetWorth) / targetAmount) * 100 : 0;
      progressPercentage = Math.min(100, Math.max(0, calc));
    }

    if (backendRemainingGap !== null && !isNaN(backendRemainingGap)) {
      gapAmount = backendRemainingGap;
    } else {
      gapAmount = Math.max(0, targetAmount - currentNetWorth);
    }
  } else if (state === "recovery") {
    if (backendProgress !== null && !isNaN(backendProgress)) {
      progressPercentage = Math.min(100, Math.max(0, backendProgress));
    } else {
      const totalSpan = Math.abs(baseline) || Math.abs(currentNetWorth) || 20000000;
      const progressFromBase = currentNetWorth - baseline;
      const calc = totalSpan > 0 ? (progressFromBase / totalSpan) * 100 : 0;
      progressPercentage = Math.min(100, Math.max(0, calc));
    }

    if (backendRemainingGap !== null && !isNaN(backendRemainingGap)) {
      gapAmount = backendRemainingGap;
    } else {
      gapAmount = Math.abs(currentNetWorth);
    }
  }

  // Trigger celebration confetti on initial achievement
  useEffect(() => {
    if (state === "achieved" && !milestone.hasCelebrated) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // ignore
      }
    }
  }, [state, milestone.hasCelebrated]);

  const handleSaveNewMilestone = (newMilestone) => {
    if (onMilestoneChange) {
      onMilestoneChange(newMilestone);
    }
  };

  // Render State 2: Milestone Achieved!
  if (state === "achieved") {
    const isBreakEven = targetAmount === 0;
    const celebrationText = isBreakEven
      ? "Congratulations! Break-Even reached 🎉"
      : `Congratulations! ${milestone.title} Achieved! 🎉`;

    return (
      <>
        <div
          style={{
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)",
            border: "1px solid rgba(16, 185, 129, 0.5)",
            boxShadow: "0 0 16px rgba(16, 185, 129, 0.2)",
            borderRadius: 12,
            padding: compact ? "8px 12px" : "10px 16px",
            minWidth: compact ? "100%" : 320,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircleFilled style={{ color: "#10B981", fontSize: 16 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#10B981" }}>
                {celebrationText}
              </span>
            </div>

            <Tag
              color="success"
              style={{
                background: "rgba(16, 185, 129, 0.2)",
                borderColor: "#10B981",
                color: "#10B981",
                fontSize: 10,
                fontWeight: 700,
                borderRadius: 12,
                margin: 0,
              }}
            >
              Achieved!
            </Tag>
          </div>

          {/* Action button to set next milestone */}
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
            style={{
              background: "linear-gradient(90deg, #06B6D4 0%, #10B981 100%)",
              border: "none",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: 11,
              borderRadius: 6,
              height: 28,
              boxShadow: "0 0 8px rgba(6, 182, 212, 0.4)",
              width: "100%",
            }}
          >
            Set Next Milestone
          </Button>
        </div>

        <SetMilestoneModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveNewMilestone}
          currentMilestone={milestone}
          currentNetWorth={currentNetWorth}
        />
      </>
    );
  }

  // Render State 3: Growth Phase (Net Worth > 0 & Target Baru Aktif)
  if (state === "growth") {
    return (
      <>
        <div
          style={{
            background: "rgba(22, 27, 34, 0.8)",
            border: "1px solid #21262D",
            borderRadius: 12,
            padding: compact ? "8px 12px" : "10px 16px",
            minWidth: compact ? "100%" : 300,
            boxSizing: "border-box",
          }}
        >
          {/* Header Title with Edit Icon */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                color: "#F0F6FC",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              <span>🚀</span>
              <span style={{ fontWeight: 700 }}>
                {milestone.title || "Milestone Target"}
              </span>
            </div>

            <Tooltip title="Edit milestone target">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined style={{ fontSize: 12, color: "#8B949E" }} />}
                onClick={() => setIsModalOpen(true)}
                style={{
                  width: 24,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  background: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 4,
                }}
              />
            </Tooltip>
          </div>

          {/* Progress Bar Track */}
          <div
            style={{
              height: 6,
              background: "#21262D",
              borderRadius: 4,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPercentage}%`,
                background:
                  progressPercentage > 0
                    ? "linear-gradient(90deg, #38BDF8 0%, #10B981 100%)"
                    : "transparent",
                borderRadius: 4,
                boxShadow:
                  progressPercentage > 0
                    ? "0 0 8px rgba(56, 189, 248, 0.6)"
                    : "none",
                transition: "width 0.4s ease",
              }}
            />
          </div>

          {/* Sub-info: Current / Target (Remaining Gap) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 4,
              marginTop: 5,
              fontSize: 11,
              color: "#8B949E",
              fontWeight: 500,
            }}
          >
            <span>
              {formatRupiah(currentNetWorth, isPrivacyMode)} / {formatRupiah(targetAmount, isPrivacyMode)}
            </span>
            <span style={{ color: "#38BDF8", fontWeight: 600 }}>
              Remaining {formatRupiah(gapAmount, isPrivacyMode)}
            </span>
          </div>
        </div>

        <SetMilestoneModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveNewMilestone}
          currentMilestone={milestone}
          currentNetWorth={currentNetWorth}
        />
      </>
    );
  }

  // Render State 1: Recovery Phase (Net Worth < 0)
  return (
    <>
      <div
        style={{
          background: "rgba(22, 27, 34, 0.8)",
          border: "1px solid #21262D",
          borderRadius: 12,
          padding: compact ? "8px 12px" : "10px 16px",
          minWidth: compact ? "100%" : 280,
          boxSizing: "border-box",
        }}
      >
        {/* Title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: "#F0F6FC",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <span>🎯</span>
            <span style={{ fontWeight: 700 }}>
              {milestone.title || "Path to Break-Even (Rp 0)"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Tooltip title="Recovery phase towards Net Worth Rp 0">
              <Tag
                style={{
                  background: "rgba(245, 158, 11, 0.12)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  color: "#F59E0B",
                  fontSize: 10,
                  fontWeight: 600,
                  borderRadius: 10,
                  margin: 0,
                  padding: "0 6px",
                  lineHeight: "18px",
                }}
              >
                Recovery
              </Tag>
            </Tooltip>

            <Tooltip title="Set or edit milestone target">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined style={{ fontSize: 12, color: "#8B949E" }} />}
                onClick={() => setIsModalOpen(true)}
                style={{
                  width: 24,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  background: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 4,
                }}
              />
            </Tooltip>
          </div>
        </div>

        {/* Progress Track: Amber to Emerald Gradient */}
        <div
          style={{
            height: 6,
            background: "#21262D",
            borderRadius: 4,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressPercentage}%`,
              background:
                progressPercentage > 0
                  ? "linear-gradient(90deg, #F59E0B 0%, #06B6D4 60%, #10B981 100%)"
                  : "transparent",
              borderRadius: 4,
              boxShadow:
                progressPercentage > 0
                  ? "0 0 8px rgba(245, 158, 11, 0.5)"
                  : "none",
              transition: "width 0.4s ease",
            }}
          />
        </div>

        {/* Bottom Labels: Rp 0 and Remaining Gap */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 4,
            marginTop: 5,
            fontSize: 11,
            color: "#8B949E",
            fontWeight: 500,
          }}
        >
          <span>Rp 0</span>
          <span>Remaining {formatRupiah(gapAmount, isPrivacyMode)}</span>
        </div>
      </div>

      <SetMilestoneModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNewMilestone}
        currentMilestone={milestone}
        currentNetWorth={currentNetWorth}
      />
    </>
  );
}
