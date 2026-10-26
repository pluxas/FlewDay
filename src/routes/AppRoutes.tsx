import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import AuthPage from "../pages/AuthPage";
import DashboardPage from "../pages/DashboardPage";
import StatisticsPage from "../pages/StatisticsPage";

import type {
  User,
  AuthCredentials,
} from "../types/auth";

// ----------------------------------
// TYPES
// ----------------------------------

interface AppRoutesProps {
  user: User | null;

  onLogin: (
    credentials: AuthCredentials
  ) => Promise<void>;

  onRegister: (
    credentials: AuthCredentials
  ) => Promise<void>;
}

// ----------------------------------
// PROTECTED ROUTES
// ----------------------------------

function ProtectedRoute({
  user,
}: {
  user: User | null;
}) {
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/auth"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}

// ----------------------------------
// AUTH ROUTE
// ----------------------------------

function AuthRoute({
  user,
  onLogin,
  onRegister,
}: AppRoutesProps) {
  const location = useLocation();

  // Если пользователь уже вошёл,
  // возвращаем его в приложение.

  if (user) {
    const requestedPath = location.state?.from;

    const destination =
      typeof requestedPath === "string" &&
      requestedPath.startsWith("/") &&
      !requestedPath.startsWith("//")
        ? requestedPath
        : "/";

    return <Navigate to={destination} replace />;
  }

  return (
    <AuthPage
      onLogin={onLogin}
      onRegister={onRegister}
    />
  );
}

// ----------------------------------
// APPLICATION ROUTES
// ----------------------------------

export default function AppRoutes({
  user,
  onLogin,
  onRegister,
}: AppRoutesProps) {
  return (
    <Routes>

      {/* AUTH */}

      <Route
        path="/auth"
        element={
          <AuthRoute
            user={user}
            onLogin={onLogin}
            onRegister={onRegister}
          />
        }
      />

      {/* PROTECTED PAGES */}

      <Route
        element={<ProtectedRoute user={user} />}
      >

        {/* DASHBOARD */}

        <Route
          path="/"
          element={
            user ? (
              <DashboardPage user={user} />
            ) : null
          }
        />

        {/* STATISTICS */}

        <Route
          path="/statistics"
          element={<StatisticsPage />}
        />

      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to={user ? "/" : "/auth"}
            replace
          />
        }
      />

    </Routes>
  );
}