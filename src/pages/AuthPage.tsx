import AuthForm from "../components/auth/AuthForm";
import type { AuthCredentials } from "../types/auth";

interface AuthPageProps {
  onLogin: (data: AuthCredentials) => Promise<void>;
  onRegister: (data: AuthCredentials) => Promise<void>;
}

export default function AuthPage({
  onLogin,
  onRegister,
}: AuthPageProps) {
  return (
    <main className="mx-auto flex w-full flex-col items-center px-4 pb-3 pt-4">
      <div className="w-full max-w-[392px]">
        <AuthForm
          onLogin={onLogin}
          onRegister={onRegister}
        />
      </div>
    </main>
  );
}