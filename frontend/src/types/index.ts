export interface RoutineStep {
  id?: number;
  routine_id?: number;
  nom: string;
  code_map: string;
  duree: number;
  tips?: string;
  order?: number;
}

export interface Routine {
  id?: number;
  nom: string;
  date?: string;
  steps: RoutineStep[];
}

export interface RoutineCreate {
  nom: string;
  steps: Omit<RoutineStep, 'id' | 'routine_id' | 'order'>[];
}
