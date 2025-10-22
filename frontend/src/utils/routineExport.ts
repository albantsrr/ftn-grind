import type { Routine, RoutineCreate } from '../types';

/**
 * Export a single routine to JSON file
 */
export function exportRoutine(routine: Routine): void {
  // Create export data without the id and date (these will be regenerated on import)
  const exportData: RoutineCreate = {
    nom: routine.nom,
    sound_type: routine.sound_type,
    volume: routine.volume,
    steps: routine.steps.map(step => ({
      nom: step.nom,
      code_map: step.code_map,
      duree: step.duree,
      tips: step.tips || undefined
    }))
  };

  // Create blob and download
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFilename(routine.nom)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export multiple routines to a single JSON file
 */
export function exportRoutines(routines: Routine[]): void {
  const exportData = routines.map(routine => ({
    nom: routine.nom,
    sound_type: routine.sound_type,
    volume: routine.volume,
    steps: routine.steps.map(step => ({
      nom: step.nom,
      code_map: step.code_map,
      duree: step.duree,
      tips: step.tips || undefined
    }))
  }));

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `fortiflow-routines-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import routines from a JSON file
 */
export function importRoutinesFromFile(): Promise<RoutineCreate[]> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        // Check if it's a single routine or an array of routines
        const routines = Array.isArray(data) ? data : [data];

        // Validate the structure
        for (const routine of routines) {
          validateRoutineStructure(routine);
        }

        resolve(routines);
      } catch (error) {
        reject(error);
      }
    };

    input.click();
  });
}

/**
 * Validate routine structure
 */
function validateRoutineStructure(routine: any): void {
  if (!routine.nom || typeof routine.nom !== 'string') {
    throw new Error('Invalid routine: missing or invalid "nom" field');
  }

  if (!Array.isArray(routine.steps) || routine.steps.length === 0) {
    throw new Error('Invalid routine: missing or empty "steps" array');
  }

  for (const step of routine.steps) {
    if (!step.nom || typeof step.nom !== 'string') {
      throw new Error('Invalid routine step: missing or invalid "nom" field');
    }
    if (!step.code_map || typeof step.code_map !== 'string') {
      throw new Error('Invalid routine step: missing or invalid "code_map" field');
    }
    if (typeof step.duree !== 'number' || step.duree <= 0) {
      throw new Error('Invalid routine step: missing or invalid "duree" field');
    }
  }
}

/**
 * Sanitize filename to remove invalid characters
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9_-]/gi, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
}
