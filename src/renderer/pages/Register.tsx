import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toggleTheme } from "../functions/theme";

const Register = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await window.api.checkAuthStatus();
      if (isAuth) {
        navigate("/dashboard");
      }
    };
    checkAuth();
  }, [navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await window.api.register({ fullName, email, password });

      if (result.success) {
        navigate("/dashboard");
      } else {
        setError(result.message || "Помилка реєстрації");
        setIsLoading(false);
      }
    } catch (err) {
      setError("Не вдалося зв'язатися з сервером");
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <button onClick={toggleTheme} className="theme-btn" title="Змінити тему">
        🌗
      </button>
      <div className="glass-card">
        <h1>Створити акаунт</h1>
        <p>Приєднуйтесь до нашої книжкової спільноти</p>
        
        <form onSubmit={handleRegister}>
          <div className="field">
            <label>Повне ім'я</label>
            <input
              type="text"
              placeholder="Іван Іванов"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              placeholder="example@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="field">
            <label>Пароль</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Реєстрація..." : "Зареєструватися"}
          </button>
        </form>
        
        <div className="auth-footer">
          <span>Вже є акаунт? </span>
          <Link to="/login">Увійти</Link>
        </div>
        
        {error && <div className="error-msg">{error}</div>}
      </div>
    </div>
  );
};

export default Register;