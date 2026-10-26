import { useEffect, useState } from "react";
import { LogOut, Moon, Sun, BarChart3, Settings2 } from "lucide-react";

import { Link } from "react-router-dom";

import AutoHideTop from "./AutoHideTop";

import type { Theme, User } from "../../types/auth";

interface HeaderProps {
  user: User | null;
  theme: Theme;
  onToggleTheme: () => Promise<void>;
  onLogout: () => Promise<void>;
}

export default function Header({
  user,
  theme,
  onToggleTheme,
  onLogout,
}: HeaderProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    function updateTime() {
      setTime(
        new Date().toLocaleTimeString("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }

    updateTime();

    const interval = window.setInterval(updateTime, 1000);

    return () => window.clearInterval(interval);
  }, []);

  async function handleThemeClick() {
    try {
      await onToggleTheme();
    } catch {
      alert("Не удалось сохранить тему");
    }
  }

  async function handleLogout() {
    try {
      await onLogout();
    } catch (error) {
      console.error("Ошибка выхода:", error);
      alert("Не удалось выйти из аккаунта");
    }
  }

  return (
    <AutoHideTop>
      <header className="flex items-center justify-between gap-3 px-5 py-5">
        {/* Logo */}

        <div className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-full bg-[#ff503b] ring-2 ring-[#ff503b]/20" />

          <span className="text-2xl font-bold">FlowDay</span>
        </div>

        {/* Actions */}

        <div className="flex items-center gap-2">
          {user && (
            <>
              {/* STATISTICS */}
              <Link
                to="/statistics"
                className="
                inline-flex h-10 items-center justify-center
                gap-2 whitespace-nowrap rounded-full
                border border-[#e2e5eb] bg-white
                px-3 text-xs font-medium text-[#374151]
                transition-all duration-200
                hover:border-[#ff503b]/40 hover:text-[#ff503b]
                dark:border-[#34363f] dark:bg-[#202127]
                dark:text-[#e5e7eb]
                dark:hover:border-[#ff503b]/50
                dark:hover:text-[#ff503b]
                md:-translate-x-2
              "
              >
                <BarChart3 size={15} strokeWidth={1.8} />
                Статистика
              </Link>

              {/* SETTINGS */}
              <Link
                to="/?settings=open"
                className="
                inline-flex h-10 items-center justify-center
                gap-2 whitespace-nowrap rounded-full
                border border-[#e2e5eb] bg-white
                px-3 text-xs font-medium text-[#374151]
                transition-all duration-200
                hover:border-[#ff503b]/40 hover:text-[#ff503b]
                dark:border-[#34363f] dark:bg-[#202127]
                dark:text-[#e5e7eb]
                dark:hover:border-[#ff503b]/50
                dark:hover:text-[#ff503b]
                md:-translate-x-2
              "
              >
                <Settings2 size={15} strokeWidth={1.8} />
                Настройки
              </Link>
            </>
          )}

          <div className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs dark:border-[#333640] dark:bg-[#222329]">
            <span className="text-gray-400">Сейчас: </span>
            <strong>{time}</strong>
          </div>

          <button
            type="button"
            onClick={handleThemeClick}
            className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-medium hover:bg-gray-100 dark:border-[#333640] dark:bg-[#222329] dark:hover:bg-[#303139]"
          >
            {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}

            <span className="hidden sm:inline">Тема</span>
          </button>

          {user && (
            <button
              type="button"
              onClick={handleLogout}
              title="Выйти из аккаунта"
              aria-label="Выйти из аккаунта"
              className="rounded-full border border-gray-200 bg-white p-2 dark:border-[#333640] dark:bg-[#222329]"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </header>
    </AutoHideTop>
  );
}
