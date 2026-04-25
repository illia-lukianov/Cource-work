import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toggleTheme } from "../../functions/theme";
import styles from "./Login.module.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAutoLogin = async () => {
      try {
        const user = await window.api.invoke("auth:get-current-user");
        if (user) {
          const role = user?.Role || user?.role;
          role === "Admin" ? navigate("/dashboard") : navigate("/");
        }
      } catch (err) {
        console.error("Auto-login check failed:", err);
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
        // Отримуємо роль з об'єкта user, який повернув бекенд
        const role = result.user?.Role;
        
        console.log(`🔐 Вхід успішний. Роль: ${role}`);
        
        // Перенаправлення залежно від ролі
        role === "Admin" ? navigate("/dashboard") : navigate("/");
      } else {
        setError(result.message || "Невірний email або пароль");
      }
    } catch (err: any) {
      setError("Критична помилка підключення до сервера");
      console.error("Login Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <button onClick={toggleTheme} className={styles.themeToggle} title="Змінити тему">
        🌗
      </button>
      <div className={styles.loginBox}>
        <h1 className={styles.loginTitle}>📚 BookStore</h1>
        <p className={styles.loginSubtitle}>Увійдіть у свій акаунт</p>

        <form className={styles.loginForm} onSubmit={handleLogin}>
          <div className={styles.formGroup}>
            <label>Email</label>
            <input
              type="email"
              placeholder="example@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Пароль</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          
          {error && <div className={styles.errorMessage}>{error}</div>}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isLoading}
          >
            {isLoading ? "Перевірка..." : "Увійти"}
          </button>
        </form>

        <div className={styles.authFooter}>
          <span>Ще не маєте акаунта? </span>
          <Link to="/register" className={styles.regLink}>Зареєструватися</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;