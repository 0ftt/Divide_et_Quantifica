import { User } from './user';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;

  username?: string;

  phone?: string;

  address?: string;
  city?: string;
  postalCode?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
