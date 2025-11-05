import type { Routine, RoutineCreate, LoginRequest, RegisterRequest, AuthResponse, User, Tag, TagCreate, RatingCreate, RoutineRatingInfo, Subscription, UserStats, ChartData, RoutineSession, LeaderboardResponse } from '../types';

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

// Helper to handle 401 errors (unauthorized)
const handle401 = () => {
  // Clear auth data from localStorage
  localStorage.removeItem('fortiflow_token');
  localStorage.removeItem('fortiflow_user');

  // Redirect to login page
  window.location.href = '/login';
};

// Enhanced fetch wrapper that handles 401 errors
const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const response = await fetch(url, options);

  // If unauthorized, clear auth and redirect to login
  if (response.status === 401) {
    handle401();
    throw new Error('Session expired. Please login again.');
  }

  return response;
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
    const response = await fetchWithAuth(`${API_URL}/api/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to get current user');
    return response.json();
  },

  // ==================== Routines ====================
  // Get all routines
  async getRoutines(): Promise<Routine[]> {
    const response = await fetchWithAuth(`${API_URL}/api/routines/`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch routines');
    return response.json();
  },

  // Get routine by ID
  async getRoutine(id: number): Promise<Routine> {
    const response = await fetchWithAuth(`${API_URL}/api/routines/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch routine');
    return response.json();
  },

  // Create routine
  async createRoutine(routine: RoutineCreate): Promise<Routine> {
    const response = await fetchWithAuth(`${API_URL}/api/routines/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(routine),
    });
    if (!response.ok) throw new Error('Failed to create routine');
    return response.json();
  },

  // Update routine
  async updateRoutine(id: number, routine: Partial<RoutineCreate>): Promise<Routine> {
    const response = await fetchWithAuth(`${API_URL}/api/routines/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(routine),
    });
    if (!response.ok) throw new Error('Failed to update routine');
    return response.json();
  },

  // Delete routine
  async deleteRoutine(id: number): Promise<void> {
    const response = await fetchWithAuth(`${API_URL}/api/routines/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete routine');
  },

  // Start routine execution
  async startRoutine(id: number): Promise<unknown> {
    const response = await fetchWithAuth(`${API_URL}/api/timer/start-routine/${id}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to start routine');
    return response.json();
  },

  // Preview routine
  async previewRoutine(id: number): Promise<unknown> {
    const response = await fetchWithAuth(`${API_URL}/api/timer/routine-preview/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to preview routine');
    return response.json();
  },

  // ==================== Community ====================

  // Get all public routines from community
  async getCommunityRoutines(params?: {
    skip?: number;
    limit?: number;
    sort_by?: 'date' | 'nom' | 'rating';
    search?: string;
    author?: string;
    tags?: string; // Comma-separated tag IDs
  }): Promise<Routine[]> {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.author) queryParams.append('author', params.author);
    if (params?.tags) queryParams.append('tags', params.tags);

    const url = `${API_URL}/api/community/routines${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetchWithAuth(url, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch community routines');
    return response.json();
  },

  // Toggle routine share status (public/private)
  async shareRoutine(id: number): Promise<Routine> {
    const response = await fetchWithAuth(`${API_URL}/api/community/routines/${id}/share`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to share routine');
    return response.json();
  },

  // ==================== Tags ====================

  // Get all tags
  async getTags(): Promise<Tag[]> {
    const response = await fetchWithAuth(`${API_URL}/api/tags/`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch tags');
    return response.json();
  },

  // Create a new tag
  async createTag(tag: TagCreate): Promise<Tag> {
    const response = await fetchWithAuth(`${API_URL}/api/tags/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(tag),
    });
    if (!response.ok) throw new Error('Failed to create tag');
    return response.json();
  },

  // Add tag to routine
  async addTagToRoutine(routineId: number, tag: TagCreate): Promise<Tag> {
    const response = await fetchWithAuth(`${API_URL}/api/tags/routines/${routineId}/tags`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(tag),
    });
    if (!response.ok) throw new Error('Failed to add tag to routine');
    return response.json();
  },

  // Remove tag from routine
  async removeTagFromRoutine(routineId: number, tagId: number): Promise<void> {
    const response = await fetchWithAuth(`${API_URL}/api/tags/routines/${routineId}/tags/${tagId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to remove tag from routine');
  },

  // ==================== Ratings ====================

  // Rate a routine (1-5 stars)
  async rateRoutine(routineId: number, ratingData: RatingCreate): Promise<void> {
    const response = await fetchWithAuth(`${API_URL}/api/ratings/routines/${routineId}/rate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(ratingData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to rate routine');
    }
  },

  // Get rating info for a routine (average, total, user's rating)
  async getRoutineRating(routineId: number): Promise<RoutineRatingInfo> {
    const response = await fetchWithAuth(`${API_URL}/api/ratings/routines/${routineId}/rating`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to get routine rating');
    return response.json();
  },

  // Delete user's rating for a routine
  async deleteRating(routineId: number): Promise<void> {
    const response = await fetchWithAuth(`${API_URL}/api/ratings/routines/${routineId}/rate`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete rating');
  },

  // ==================== Password Reset & Email Verification ====================

  // Request password reset email
  async forgotPassword(email: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to send password reset email');
    }
  },

  // Reset password with token
  async resetPassword(data: { token: string; new_password: string }): Promise<void> {
    const response = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to reset password');
    }
  },

  // Verify email with token
  async verifyEmail(data: { token: string }): Promise<void> {
    const response = await fetch(`${API_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to verify email');
    }
  },

  // Resend verification email
  async resendVerificationEmail(): Promise<void> {
    const response = await fetchWithAuth(`${API_URL}/api/auth/resend-verification`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to resend verification email');
    }
  },

  // ==================== Profile Management ====================

  // Update user profile
  async updateProfile(data: { username?: string; email?: string; full_name?: string }): Promise<User> {
    const response = await fetchWithAuth(`${API_URL}/api/auth/update-profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update profile');
    }
    return response.json();
  },

  // Change password
  async changePassword(data: { current_password: string; new_password: string }): Promise<void> {
    const response = await fetchWithAuth(`${API_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to change password');
    }
  },

  // Update avatar
  async updateAvatar(avatar_url: string): Promise<User> {
    const response = await fetchWithAuth(`${API_URL}/api/auth/update-avatar`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ avatar_url }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update avatar');
    }
    return response.json();
  },

  // ==================== Subscriptions ====================

  // Get subscription status
  async getSubscriptionStatus(): Promise<Subscription> {
    const response = await fetchWithAuth(`${API_URL}/api/subscriptions/status`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to get subscription status');
    return response.json();
  },

  // Create Stripe checkout session
  async createCheckoutSession(): Promise<{ url: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/subscriptions/create-checkout-session`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create checkout session');
    }
    return response.json();
  },

  // Create Stripe customer portal session
  async createPortalSession(): Promise<{ url: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/subscriptions/portal`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create portal session');
    }
    return response.json();
  },

  // Cancel subscription at period end
  async cancelSubscription(): Promise<{ success: boolean; message: string; period_end: string }> {
    const response = await fetchWithAuth(`${API_URL}/api/subscriptions/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to cancel subscription');
    }
    return response.json();
  },

  // ==================== Statistics ====================

  // Start a routine session
  async startSession(routineId: number): Promise<RoutineSession> {
    const response = await fetchWithAuth(`${API_URL}/api/statistics/session/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ routine_id: routineId }),
    });
    if (!response.ok) throw new Error('Failed to start session');
    return response.json();
  },

  // Complete a routine session
  async completeSession(sessionId: number, totalDuration: number): Promise<RoutineSession> {
    const response = await fetchWithAuth(`${API_URL}/api/statistics/session/${sessionId}/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ total_duration: totalDuration }),
    });
    if (!response.ok) throw new Error('Failed to complete session');
    return response.json();
  },

  // Get user statistics
  async getUserStats(): Promise<UserStats> {
    const response = await fetchWithAuth(`${API_URL}/api/statistics/me`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get user stats');
    }
    return response.json();
  },

  // Get chart data
  async getChartData(): Promise<ChartData> {
    const response = await fetchWithAuth(`${API_URL}/api/statistics/chart-data`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get chart data');
    }
    return response.json();
  },

  // Get recent sessions
  async getRecentSessions(limit: number = 10): Promise<RoutineSession[]> {
    const response = await fetchWithAuth(`${API_URL}/api/statistics/sessions/recent?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to get recent sessions');
    return response.json();
  },

  // ==================== Leaderboard ====================

  // Get leaderboard
  async getLeaderboard(params?: {
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<LeaderboardResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.search) queryParams.append('search', params.search);

    const response = await fetchWithAuth(`${API_URL}/api/leaderboard?${queryParams}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get leaderboard');
    }
    return response.json();
  },
};
