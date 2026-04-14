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
    <div className={styles.loginContainer}>
      <button onClick={toggleTheme} className={styles.themeToggle}>
        🌗
      </button>
      <div className={styles.loginBox}>
        <h1 className={styles.loginTitle}>📚 BookStore</h1>
        <p>Увійдіть у свій акаунт</p>

        <form className={styles.loginForm} onSubmit={handleLogin}>
          <div className={styles.formGroup}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isLoading}
          >
            {isLoading ? "Завантаження..." : "Увійти"}
          </button>
        </form>

        <div className={styles.authFooter}>
          <span>Ще не маєте акаунта? </span>
          <Link to="/register">Зареєструватися</Link>
        </div>
        {error && <div className={styles.errorMessage}>{error}</div>}
      </div>
    </div>
  );
};

export default Login;
