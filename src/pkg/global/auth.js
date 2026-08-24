import { message } from "antd";
import api from "src/pkg/api";

export const handleLogout = async () => {
  try {
    await api.post("/v1/logout");
  } catch (err) {
    console.error(err);
  } finally {
    localStorage.removeItem("USER");
    message.success("You have been logged out.");
    window.location.replace("/login");
  }
};
