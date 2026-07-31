import type { User } from '$shared';

export interface PublicUserRow {
  id: string;
  email: string;
  display_name: string;
  username: string | null;
  phone: string | null;
  address: string;
  city: string;
  postal_code: string;
  role: 'user' | 'admin';
  credit: string;
  is_premium: boolean;
  avatar_data_url: string | null;
}

export function toPublicUser(u: PublicUserRow): User {
  return {
    id: u.id,
    email: u.email,
    displayName: u.display_name,
    username: u.username,
    phone: u.phone,
    address: u.address,
    city: u.city,
    postalCode: u.postal_code,
    role: u.role,
    credit: Number(u.credit),
    isPremium: u.is_premium || u.role === 'admin',
    avatarDataUrl: u.avatar_data_url,
  };
}
