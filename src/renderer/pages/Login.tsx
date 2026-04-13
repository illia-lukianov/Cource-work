import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toggleTheme } from "../functions/theme";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAutoLogin = async () => {
      const isAuth = await window.api.checkAuthStatus();
      if (isAuth) {
        navigate("/dashboard");
      }
    };
    checkAutoLogin();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await window.api.login({ username: email, password });
      if (result.success) {
        navigate("/dashboard"); // Миттєвий перехід без перезавантаження!
      } else {
        setError(result.message || "Помилка входу");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <button onClick={toggleTheme} className="theme-btn">
        🌗
      </button>
      <div className="glass-card">
        <h1>📚 BookStore</h1>
        <p>Увійдіть у свій акаунт</p>

        <form onSubmit={handleLogin}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Завантаження..." : "Увійти"}
          </button>
        </form>

        <div className="auth-footer">
          <span>Ще не маєте акаунта? </span>
          <Link to="/register">Зареєструватися</Link>
        </div>
        {error && <div className="error-msg">{error}</div>}
      </div>
    </div>
  );
};

export default Login;
