import { useState, type FormEvent } from "react";

import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";

import type { AuthCredentials } from "../../types/auth";

type AuthMode = "login" | "register";

interface AuthFormProps {
  onLogin: (data: AuthCredentials) => Promise<void>;
  onRegister: (data: AuthCredentials) => Promise<void>;
}

export default function AuthForm({
  onLogin,
  onRegister,
}: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
  
    setError("");
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (mode === "register" && password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    const credentials: AuthCredentials = {
      email,
      password,
      remember,
    };

    setLoading(true);

    try {
      if (mode === "login") {
        await onLogin(credentials);
      } else {
        await onRegister(credentials);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Произошла ошибка"
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "h-11 w-full rounded-xl bg-[#f3f4f6] pl-10 pr-11 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-[#ff503b]/30 dark:bg-[#292b33]";

  return (
    <div className="w-full rounded-[25px] border border-gray-200 bg-white p-7 shadow-[0_14px_35px_rgba(20,25,40,0.07)] dark:border-[#333640] dark:bg-[#202127] sm:p-8">

      {/* Heading */}

      <div className="mb-6 text-center">
        <h1 className="text-[22px] font-bold tracking-tight">
          {mode === "login"
            ? "С возвращением в FlowDay"
            : "Создать аккаунт FlowDay"}
        </h1>

        <p className="mt-2 text-[13px] leading-5 text-gray-400">
          {mode === "login"
            ? "Войди в аккаунт, чтобы продолжить свои сессии Помодоро"
            : "Создай аккаунт, чтобы сохранять задачи и прогресс"}
        </p>
      </div>

      {/* Tabs */}

      <div className="mb-6 flex rounded-2xl border border-gray-200 bg-[#f3f4f6] p-1 dark:border-[#383a43] dark:bg-[#292b33]">

        <button
          type="button"
          onClick={() => changeMode("login")}
          className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition ${
            mode === "login"
              ? "bg-[#17181e] text-white"
              : "text-gray-400"
          }`}
        >
          Вход в аккаунт
        </button>

        <button
          type="button"
          onClick={() => changeMode("register")}
          className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition ${
            mode === "register"
              ? "bg-[#17181e] text-white"
              : "text-gray-400"
          }`}
        >
          Регистрация
        </button>

      </div>

      {/* Form */}

      <form onSubmit={handleSubmit}>

        {/* Email */}

        <div className="mb-4">
          <label
            htmlFor="auth-email"
            className="mb-2 block text-xs font-semibold"
          >
            Email адрес
          </label>

          <div className="relative">
            <Mail
              size={16}
              className="absolute left-4 top-3.5 text-gray-400"
            />

            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              maxLength={254}
              required
              className={inputClass}
            />
          </div>
        </div>

        {/* Password */}

        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="auth-password"
              className="text-xs font-semibold"
            >
              Пароль
            </label>

            {mode === "login" && (
              <span
                className="text-xs text-gray-400"
                title="Восстановление пароля подключим позже"
              >
                Забыли пароль?
              </span>
            )}
          </div>

          <div className="relative">
            <LockKeyhole
              size={16}
              className="absolute left-4 top-3.5 text-gray-400"
            />

            <input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 8 символов"
              minLength={8}
              required
              autoComplete={
                mode === "login"
                  ? "current-password"
                  : "new-password"
              }
              className={inputClass}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={
                showPassword ? "Скрыть пароль" : "Показать пароль"
              }
              className="absolute right-4 top-3.5 text-gray-400"
            >
              {showPassword ? (
                <EyeOff size={16} />
              ) : (
                <Eye size={16} />
              )}
            </button>
          </div>
        </div>

        {/* Confirm password */}

        {mode === "register" && (
          <div className="mb-4">
            <label
              htmlFor="auth-confirm"
              className="mb-2 block text-xs font-semibold"
            >
              Подтверждение пароля
            </label>

            <div className="relative">
              <LockKeyhole
                size={16}
                className="absolute left-4 top-3.5 text-gray-400"
              />

              <input
                id="auth-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="Повтори пароль"
                minLength={8}
                required
                autoComplete="new-password"
                className={inputClass}
              />
            </div>
          </div>
        )}

        {/* Remember */}

        <label className="mb-6 mt-4 flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 accent-[#ff503b]"
          />

          <span className="text-[11px] text-gray-400">
            Сохранить сессию и синхронизировать задачи
          </span>
        </label>

        {/* Error */}

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400"
          >
            {error}
          </p>
        )}

        {/* Submit */}

        <button
          type="submit"
          disabled={loading}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#ff503b] text-sm font-semibold text-white shadow-lg shadow-[#ff503b]/15 transition hover:bg-[#ed4633] disabled:opacity-60"
        >
          {loading
            ? "Подождите..."
            : mode === "login"
              ? "Войти в FlowDay"
              : "Создать аккаунт"}

          {!loading && <ArrowRight size={16} />}
        </button>
      </form>

      {/* OAuth buttons */}

      {mode === "login" && (
        <>
          {/* OAuth buttons */}
      
          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200 dark:bg-[#383a43]" />
      
            <span className="text-[10px] font-semibold text-gray-400">
              ИЛИ ЧЕРЕЗ СЕРВИС
            </span>
      
            <div className="h-px flex-1 bg-gray-200 dark:bg-[#383a43]" />
          </div>
      
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled
              className="flex h-9 items-center justify-center rounded-xl border border-gray-200 bg-[#f3f4f6] text-xs font-semibold opacity-60 dark:border-[#383a43] dark:bg-[#292b33]"
            >
              Google
            </button>
      
            <button
              type="button"
              disabled
              className="flex h-9 items-center justify-center rounded-xl border border-gray-200 bg-[#f3f4f6] text-xs font-semibold opacity-60 dark:border-[#383a43] dark:bg-[#292b33]"
            >
              GitHub
            </button>
          </div>
        </>
      )}

      {/* Footer */}

      <div className="mt-6 border-t border-gray-200 pt-5 text-center dark:border-[#383a43]">
        <span className="text-xs text-gray-400">
          {mode === "login"
            ? "Ещё нет аккаунта?"
            : "Уже есть аккаунт?"}
        </span>

        <button
          type="button"
          onClick={() =>
            changeMode(mode === "login" ? "register" : "login")
          }
          className="ml-1 text-xs font-semibold text-[#ff503b]"
        >
          {mode === "login"
            ? "Создать аккаунт →"
            : "Войти →"}
        </button>
      </div>

    </div>
  );
}
