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
  steps: RoutineStep[];
}

export interface RoutineCreate {
  nom: string;
  sound_type?: SoundType;
  volume?: number;
  steps: Omit<RoutineStep, 'id' | 'routine_id' | 'order'>[];
}
