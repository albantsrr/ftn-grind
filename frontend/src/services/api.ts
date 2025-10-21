import type { Routine, RoutineCreate } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = {
  // Get all routines
  async getRoutines(): Promise<Routine[]> {
    const response = await fetch(`${API_URL}/api/routines/`);
    if (!response.ok) throw new Error('Failed to fetch routines');
    return response.json();
  },

  // Get routine by ID
  async getRoutine(id: number): Promise<Routine> {
    const response = await fetch(`${API_URL}/api/routines/${id}`);
    if (!response.ok) throw new Error('Failed to fetch routine');
    return response.json();
  },

  // Create routine
  async createRoutine(routine: RoutineCreate): Promise<Routine> {
    const response = await fetch(`${API_URL}/api/routines/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(routine),
    });
    if (!response.ok) throw new Error('Failed to create routine');
    return response.json();
  },

  // Update routine
  async updateRoutine(id: number, routine: Partial<RoutineCreate>): Promise<Routine> {
    const response = await fetch(`${API_URL}/api/routines/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(routine),
    });
    if (!response.ok) throw new Error('Failed to update routine');
    return response.json();
  },

  // Delete routine
  async deleteRoutine(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/routines/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete routine');
  },

  // Start routine execution
  async startRoutine(id: number): Promise<any> {
    const response = await fetch(`${API_URL}/api/timer/start-routine/${id}`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to start routine');
    return response.json();
  },

  // Preview routine
  async previewRoutine(id: number): Promise<any> {
    const response = await fetch(`${API_URL}/api/timer/routine-preview/${id}`);
    if (!response.ok) throw new Error('Failed to preview routine');
    return response.json();
  },
};
