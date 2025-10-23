import type { Routine, RoutineCreate, LoginRequest, RegisterRequest, AuthResponse, User } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper to get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('fortiflow_token');
};

// Helper to create headers with auth token
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // ==================== Authentication ====================

  // Login
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    // OAuth2 expects form data, not JSON
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }
    return response.json();
  },

  // Register
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }
    return response.json();
  },

  // Get current user
  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to get current user');
    return response.json();
  },

  // ==================== Routines ====================
  // Get all routines
  async getRoutines(): Promise<Routine[]> {
    const response = await fetch(`${API_URL}/api/routines/`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch routines');
    return response.json();
  },

  // Get routine by ID
  async getRoutine(id: number): Promise<Routine> {
    const response = await fetch(`${API_URL}/api/routines/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch routine');
    return response.json();
  },

  // Create routine
  async createRoutine(routine: RoutineCreate): Promise<Routine> {
    const response = await fetch(`${API_URL}/api/routines/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(routine),
    });
    if (!response.ok) throw new Error('Failed to create routine');
    return response.json();
  },

  // Update routine
  async updateRoutine(id: number, routine: Partial<RoutineCreate>): Promise<Routine> {
    const response = await fetch(`${API_URL}/api/routines/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(routine),
    });
    if (!response.ok) throw new Error('Failed to update routine');
    return response.json();
  },

  // Delete routine
  async deleteRoutine(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/routines/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete routine');
  },

  // Start routine execution
  async startRoutine(id: number): Promise<any> {
    const response = await fetch(`${API_URL}/api/timer/start-routine/${id}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to start routine');
    return response.json();
  },

  // Preview routine
  async previewRoutine(id: number): Promise<any> {
    const response = await fetch(`${API_URL}/api/timer/routine-preview/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to preview routine');
    return response.json();
  },
};
