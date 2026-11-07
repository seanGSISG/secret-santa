export interface User {
  id: number;
  email: string;
  name: string;
  isAdmin: boolean;
  hasSeenReveal: boolean;
  language: Language;
  secondhandPreference: boolean;
  participatesInDraw: boolean;
}

export type Language = 'fr' | 'en';

export interface EventMilestone {
  label: Record<Language, string>;
  date: string;
}

export interface PublicConfig {
  wishlistEnabled: boolean;
  pageTitle: string;
  gameTitle: string;
  subtitle: Record<Language, string>;
  welcomeMessage: Record<Language, string>;
  registrationRules: Record<Language, string>;
  milestones: EventMilestone[];
  spendingLimitEur: number | null;
}

export interface Match {
  id: number;
  recipient: {
    id: number;
    name: string;
    email: string;
  };
  firstTime: boolean;
}

export interface WishlistItem {
  id: number;
  userId: number;
  amazonUrl: string;
  title: string | null;
  imageUrl: string | null;
  price: string | null;
  addedAt: string;
}

export interface ApiError {
  error: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
}

export interface MatchResponse {
  firstTime: boolean;
  recipient: {
    id: number;
    name: string;
    email: string;
  };
}

// Admin types
export interface AdminUser {
  id: number;
  email: string;
  name: string;
  isAdmin: boolean;
  hasSeenReveal: boolean;
  language: Language;
  secondhandPreference: boolean;
  participatesInDraw: boolean;
  createdAt: string;
}

export interface AdminUsersResponse {
  users: AdminUser[];
}

export interface CreateUserRequest {
  email: string;
  name: string;
  isAdmin?: boolean;
  password?: string;
}

export interface CreateUserResponse {
  user: AdminUser;
  password: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
}

export interface UpdateUserResponse {
  user: AdminUser;
}

export interface ResetPasswordResponse {
  password: string;
}

export interface AdminMatch {
  id: number;
  giver: {
    id: number;
    name: string;
    email: string;
  };
  receiver: {
    id: number;
    name: string;
    email: string;
  };
}

export interface AdminMatchesResponse {
  year: number;
  matches: AdminMatch[];
}

export interface UpdateMatchesRequest {
  matches: {
    giver_id: number;
    receiver_id: number;
  }[];
}
