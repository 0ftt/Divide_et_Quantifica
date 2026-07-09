import { UserRole } from './common';

export interface User {
  id: string;
  email: string;
  displayName: string;

  username?: string | null;

  phone?: string | null;

  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  role: UserRole;
  credit: number;
  isPremium: boolean;
  avatarDataUrl?: string | null;
}
