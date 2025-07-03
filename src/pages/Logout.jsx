import React from "react";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const navigate = useNavigate();
  React.useEffect(() => {
    localStorage.removeItem("auth");
    navigate("/login");
  }, [navigate]);
  return null;
};

export default Logout;
