import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { initTheme } from "./functions/theme";
import Dashboard from "./pages/Dashboard/Dashboard";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Home from "./pages/Home/Home";
import Cart from "./pages/Cart/Cart";

const App = () => {
  useEffect(() => {
    initTheme();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/cart" element={<Cart />} />
    </Routes>
  );
};

export default App;
