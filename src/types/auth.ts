export type Theme = "light" | "dark";

export interface User {
  id: string;
  email: string;
  theme: Theme;
  focusMinutes: number;
  breakMinutes: number;
}

export interface AuthCredentials {
  email: string;
  password: string;
  remember: boolean;
}

export interface AuthResponse {
  user: User;
}
