import React, { createContext, useContext, useState, useEffect } from "react";

const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  const [isPrivacyMode, setIsPrivacyMode] = useState(() => {
    const saved = localStorage.getItem("netbase_privacy_mode");
    if (saved !== null) {
      return JSON.parse(saved);
    }
    // Check fallback old key
    const oldSaved = localStorage.getItem("netbase_show_value");
    if (oldSaved !== null) {
      return !JSON.parse(oldSaved);
    }
    return false; // Default: show nominal values
  });

  const [selectedTimeframe, setSelectedTimeframe] = useState("1M");

  useEffect(() => {
    localStorage.setItem("netbase_privacy_mode", JSON.stringify(isPrivacyMode));
    localStorage.setItem("netbase_show_value", JSON.stringify(!isPrivacyMode));
  }, [isPrivacyMode]);

  const togglePrivacyMode = () => {
    setIsPrivacyMode((prev) => !prev);
  };

  return (
    <DashboardContext.Provider
      value={{
        isPrivacyMode,
        setIsPrivacyMode,
        togglePrivacyMode,
        selectedTimeframe,
        setSelectedTimeframe,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    // Fallback if not inside provider
    return {
      isPrivacyMode: false,
      setIsPrivacyMode: () => { },
      togglePrivacyMode: () => { },
      selectedTimeframe: "1M",
      setSelectedTimeframe: () => { },
    };
  }
  return context;
};
