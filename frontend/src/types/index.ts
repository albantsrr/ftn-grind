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
  is_active: boolean;
  created_at: string;
}

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
