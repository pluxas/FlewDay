import Header from "./components/layout/Header";

import AppRoutes from "./routes/AppRoutes";

import { useSession } from "./hooks/useSession";

import PomodoroNotifier from "./components/notifications/PomodoroNotifier";

export default function App() {
  const { user, loading, theme, login, register, logout, toggleTheme } =
    useSession();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f7f8fa] dark:bg-[#111216]">
        <p className="text-sm text-gray-400">🍅 Загрузка FlewDay...</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#f7f8fa] text-[#17181e] transition-colors dark:bg-[#111216] dark:text-white">
      <Header
        user={user}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={logout}
      />

      <AppRoutes user={user} onLogin={login} onRegister={register} />

      {user && <PomodoroNotifier key={user.id} />}
    </div>
  );
}
