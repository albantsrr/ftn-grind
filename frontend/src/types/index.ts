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

export interface Routine {
  id?: number;
  nom: string;
  date?: string;
  sound_type?: SoundType;
  volume?: number;
  image_url?: string;
  steps: RoutineStep[];
}

export interface RoutineCreate {
  nom: string;
  sound_type?: SoundType;
  volume?: number;
  image_url?: string;
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
