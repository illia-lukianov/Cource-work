import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toggleTheme } from "../../functions/theme";
import styles from "./Login.module.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAutoLogin = async () => {
      try {
        const savedUser = localStorage.getItem("bookstore_user");
        if (!savedUser) {
          console.log("[AUTH] Немає збереженої сесії");
          setIsLoading(false);
          return;
        }

        const user = JSON.parse(savedUser);
        console.log("[AUTH] Спроба відновити сесію для:", user.email);

        const result = await window.api.validateSession(user);

        if (result.success && result.user) {
          console.log(
            `[AUTH] Сесія відновлена! Перенаправляю на ${result.user.role === "Admin" ? "/dashboard" : "/"}`,
          );
          result.user.role === "Admin" ? navigate("/dashboard") : navigate("/");
        } else {
          console.log("[AUTH] Сесія недійсна, видаляю дані");
          localStorage.removeItem("bookstore_user");
          setIsLoading(false);
        }
      } catch (err) {
        console.error("[AUTH] Помилка при перевірці сесії:", err);
        setIsLoading(false);
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
        const role = result.user?.role;
        console.log(`🔐 Вхід успішний. Роль: ${role}`);

        if (result.user) {
          localStorage.setItem("bookstore_user", JSON.stringify(result.user));
        }

        role === "Admin" ? navigate("/dashboard") : navigate("/");
      } else {
        setError(result.message || "Невірний email або пароль");
        setIsLoading(false);
      }
    } catch (err: any) {
      setError("Критична помилка підключення до сервера");
      console.error("[AUTH] Login Error:", err);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginBox}>
          <p>Завантаження...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.loginContainer}>
      <button
        onClick={toggleTheme}
        className={styles.themeToggle}
        title="Змінити тему"
      >
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
          <Link to="/register" className={styles.regLink}>
            Зареєструватися
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
