import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "src/pkg/api";

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

  const [cycleStartDay, setCycleStartDay] = useState(() => {
    const saved = localStorage.getItem("netbase_cycle_start_day");
    if (saved !== null) {
      const parsed = Number(JSON.parse(saved));
      if (parsed >= 1 && parsed <= 31) return parsed;
    }
    return 1; // Default to 1st of month
  });

  useEffect(() => {
    localStorage.setItem("netbase_privacy_mode", JSON.stringify(isPrivacyMode));
    localStorage.setItem("netbase_show_value", JSON.stringify(!isPrivacyMode));
  }, [isPrivacyMode]);

  const togglePrivacyMode = () => {
    setIsPrivacyMode((prev) => !prev);
  };

  const fetchUserSettings = useCallback(async () => {
    try {
      const response = await api.get("/v1/users/settings");
      const respBody = response?.data;
      const settings = respBody?.data !== undefined ? respBody.data : respBody;
      if (settings?.cycle_start_day) {
        const day = Number(settings.cycle_start_day) || 1;
        setCycleStartDay(day);
        localStorage.setItem("netbase_cycle_start_day", JSON.stringify(day));
      }
    } catch (err) {
      // Graceful fallback - keep existing or default value
      console.warn("Could not fetch user settings:", err?.message);
    }
  }, []);

  const updateCycleStartDay = async (day) => {
    const validDay = Math.max(1, Math.min(31, Number(day) || 1));
    const response = await api.put("/v1/users/settings", {
      cycle_start_day: validDay,
    });
    setCycleStartDay(validDay);
    localStorage.setItem("netbase_cycle_start_day", JSON.stringify(validDay));
    return response?.data;
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("USER");
    if (storedUser) {
      fetchUserSettings();
    }
  }, [fetchUserSettings]);

  return (
    <DashboardContext.Provider
      value={{
        isPrivacyMode,
        setIsPrivacyMode,
        togglePrivacyMode,
        selectedTimeframe,
        setSelectedTimeframe,
        cycleStartDay,
        setCycleStartDay,
        fetchUserSettings,
        updateCycleStartDay,
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
      cycleStartDay: 1,
      setCycleStartDay: () => { },
      fetchUserSettings: async () => { },
      updateCycleStartDay: async () => { },
    };
  }
  return context;
};

