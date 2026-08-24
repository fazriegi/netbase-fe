import React from "react";
import MilestoneTracker from "./MilestoneTracker";

export default function MilestoneBar({
  milestoneData,
  currentNetWorth = 0,
  onMilestoneChange,
  compact = false,
}) {
  return (
    <MilestoneTracker
      milestoneData={milestoneData}
      currentNetWorth={currentNetWorth}
      onMilestoneChange={onMilestoneChange}
      compact={compact}
    />
  );
}
