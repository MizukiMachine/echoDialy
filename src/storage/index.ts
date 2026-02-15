/**
 * Storage Module
 * Handles local JSON storage for diary entries
 */

export interface DiaryEntry {
  id: string;
  date: string;
  audioText: string;
  imagePath: string;
  prompt: string;
  createdAt: string;
}

export interface DiaryStorage {
  diaries: DiaryEntry[];
}

/**
 * Load all diary entries from JSON file
 */
export async function loadDiaries(): Promise<DiaryStorage> {
  // TODO: Implement JSON loading
  return { diaries: [] };
}

/**
 * Save a new diary entry
 */
export async function saveDiary(entry: DiaryEntry): Promise<void> {
  // TODO: Implement JSON saving
  throw new Error('Not implemented: saveDiary');
}

/**
 * List all diary entries
 */
export async function listDiaries(): Promise<DiaryEntry[]> {
  const storage = await loadDiaries();
  return storage.diaries;
}
