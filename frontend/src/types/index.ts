export interface RoutineStep {
  id?: number;
  routine_id?: number;
  nom: string;
  code_map: string;
  duree: number;
  tips?: string;
  order?: number;
}

export type SoundType = 'beep' | 'bell' | 'chime' | 'notification';

// Tag types
export interface Tag {
  id: number;
  nom: string;
  color: string;
}

export interface TagCreate {
  nom: string;
  color?: string;
}

export interface Routine {
  id?: number;
  nom: string;
  date?: string;
  sound_type?: SoundType;
  volume?: number;
  image_url?: string;
  is_public?: boolean;
  author_name?: string;
  user_id?: number;
  average_rating?: number;
  total_ratings?: number;
  steps: RoutineStep[];
  tags?: Tag[];
}

export interface RoutineCreate {
  nom: string;
  sound_type?: SoundType;
  volume?: number;
  image_url?: string;
  is_public?: boolean;
  author_name?: string;
  steps: Omit<RoutineStep, 'id' | 'routine_id' | 'order'>[];
}

// Authentication types
export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  is_active: boolean;
  is_verified: boolean;
  subscription_tier: 'free' | 'premium';
  created_at: string;
}

// Frontend config constants
export const SUBSCRIPTION_LIMITS = {
  FREE_MAX_ROUTINES: 2,
  PREMIUM_MAX_ROUTINES: -1, // Unlimited
} as const;

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Rating types
export interface RatingCreate {
  rating: number;
}

export interface RatingResponse {
  id: number;
  routine_id: number;
  user_id: number;
  rating: number;
  created_at: string;
}

export interface RoutineRatingInfo {
  average_rating: number;
  total_ratings: number;
  user_rating: number | null;
}

// Subscription types
export interface Subscription {
  id: number;
  user_id: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: 'free' | 'active' | 'canceled' | 'past_due';
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

// Statistics types
export interface RoutineSession {
  id: number;
  user_id: number;
  routine_id: number;
  started_at: string;
  completed_at: string | null;
  total_duration: number | null;
  completed: boolean;
  created_at: string;
}

export interface UserStats {
  total_routines_completed: number;
  total_time_seconds: number;
  current_streak: number;
  longest_streak: number;
  grade: string;
}

export interface ChartDataPoint {
  date: string;
  count: number;
  duration: number;
}

export interface ChartData {
  routines_by_day: ChartDataPoint[];
  last_30_days: ChartDataPoint[];
}
