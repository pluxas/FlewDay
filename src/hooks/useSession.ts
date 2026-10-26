import { useEffect, useState } from "react";

import * as authApi from "../services/authApi";

import type {
  AuthCredentials,
  Theme,
  User,
} from "../types/auth";

export function useSession() {
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  const [theme, setTheme] = useState<Theme>(() => {
    return localStorage.getItem("flewday-theme") === "dark"
      ? "dark"
      : "light";
  });

  // Применяем выбранную тему
  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      theme === "dark"
    );

    localStorage.setItem("flewday-theme", theme);
  }, [theme]);

  // Проверяем авторизацию при открытии сайта
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const data = await authApi.getCurrentUser();

        if (cancelled) return;

        if (data.user) {
          setUser(data.user);
          setTheme(data.user.theme);
        }
      } catch (error) {
        console.error("Ошибка восстановления сессии:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  // Вход
  async function login(credentials: AuthCredentials) {
    const data = await authApi.login(credentials);

    setUser(data.user);
    setTheme(data.user.theme);
  }

  // Регистрация
  async function register(credentials: AuthCredentials) {
    const data = await authApi.register(credentials, theme);

    setUser(data.user);
    setTheme(data.user.theme);
  }

  // Выход
  async function logout() {
    await authApi.logout();

    setUser(null);
  }

  // Смена темы
  async function toggleTheme() {
    const previousTheme = theme;

    const nextTheme: Theme =
      theme === "light" ? "dark" : "light";

    setTheme(nextTheme);

    if (!user) return;

    try {
      await authApi.saveTheme(nextTheme);

      setUser({
        ...user,
        theme: nextTheme,
      });
    } catch (error) {
      setTheme(previousTheme);
      throw error;
    }
  }

  return {
    user,
    loading,
    theme,
    login,
    register,
    logout,
    toggleTheme,
  };
}