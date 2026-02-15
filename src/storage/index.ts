/**
 * Storage Module - Local JSON Storage
 * Handles local JSON file storage for diary entries with CRUD operations
 *
 * Design Principles:
 * 1. JSON Schema: Type-safe diary entry structure
 * 2. Atomic Operations: Read-modify-write pattern for data integrity
 * 3. Filtering: Flexible search and filter capabilities
 * 4. Sorting: Multiple sort options (date, created, etc.)
 * 5. Validation: Input validation before saving
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Core diary entry structure
 */
export interface DiaryEntry {
  id: string;              // Unique identifier (UUID or date-based)
  date: string;             // Date in YYYY-MM-DD format
  audioText: string;        // Transcribed voice input
  imagePath: string;        // Path to generated image
  prompt: string;           // Prompt used for image generation
  createdAt: string;        // ISO timestamp
  updatedAt?: string;       // ISO timestamp (optional)
  style?: string;            // Art style used (optional)
  mood?: string;             // Mood used (optional)
}

/**
 * Storage file structure
 */
export interface DiaryStorage {
  version: string;          // Storage format version
  diaries: DiaryEntry[];
  lastModified: string;      // ISO timestamp
}

/**
 * Filter options for listing/searching
 */
export interface DiaryFilterOptions {
  startDate?: string;        // YYYY-MM-DD format
  endDate?: string;          // YYYY-MM-DD format
  searchText?: string;        // Text search in audioText
  style?: string;             // Filter by art style
  mood?: string;              // Filter by mood
}

/**
 * Sort options
 */
export type DiarySortField = 'date' | 'createdAt' | 'updatedAt';
export type DiarySortOrder = 'asc' | 'desc';

export interface DiarySortOptions {
  field?: DiarySortField;
  order?: DiarySortOrder;
}

/**
 * List options with filter and sort
 */
export interface DiaryListOptions {
  filter?: DiaryFilterOptions;
  sort?: DiarySortOptions;
  limit?: number;            // Max entries to return
}

// ============================================================================
// Configuration
// ============================================================================

const STORAGE_VERSION = '1.0.0';
const DEFAULT_STORAGE_PATH = './data/diaries.json';

/**
 * Get storage file path (can be overridden with env var)
 */
function getStoragePath(): string {
  return process.env.DIARY_STORAGE_PATH || DEFAULT_STORAGE_PATH;
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Load all diary entries from JSON file
 */
export async function loadDiaries(
  storagePath?: string
): Promise<DiaryStorage> {
  const filePath = storagePath || getStoragePath();

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const storage: DiaryStorage = JSON.parse(content);

    // Validate storage structure
    if (!storage.diaries || !Array.isArray(storage.diaries)) {
      throw new Error('Invalid storage format: missing or invalid "diaries" array');
    }

    return storage;

  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
      // File doesn't exist, return empty storage
      return createEmptyStorage();
    }
    throw error;
  }
}

/**
 * Create empty storage structure
 */
function createEmptyStorage(): DiaryStorage {
  return {
    version: STORAGE_VERSION,
    diaries: [],
    lastModified: new Date().toISOString(),
  };
}

/**
 * Save storage to JSON file (atomic write)
 */
async function writeStorage(
  storage: DiaryStorage,
  storagePath?: string
): Promise<void> {
  const filePath = storagePath || getStoragePath();

  // Update lastModified timestamp
  storage.lastModified = new Date().toISOString();

  // Ensure directory exists
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  // Atomic write: write to temp file, then rename
  const tempPath = `${filePath}.tmp`;
  const content = JSON.stringify(storage, null, 2);

  await fs.writeFile(tempPath, content, 'utf-8');
  await fs.rename(tempPath, filePath);
}

/**
 * Generate unique ID for diary entry
 */
function generateEntryId(date: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `${date}-${timestamp}-${random}`;
}

/**
 * Validate diary entry before saving
 */
function validateEntry(entry: Partial<DiaryEntry>): void {
  if (!entry.audioText || entry.audioText.trim().length === 0) {
    throw new Error('audioText is required and cannot be empty');
  }

  if (!entry.imagePath || entry.imagePath.trim().length === 0) {
    throw new Error('imagePath is required and cannot be empty');
  }

  if (!entry.prompt || entry.prompt.trim().length === 0) {
    throw new Error('prompt is required and cannot be empty');
  }

  if (!entry.date || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
    throw new Error('date must be in YYYY-MM-DD format');
  }
}

/**
 * Save a new diary entry
 */
export async function saveDiary(
  entry: Omit<DiaryEntry, 'id' | 'createdAt'>,
  storagePath?: string
): Promise<DiaryEntry> {
  // Validate input
  validateEntry(entry);

  // Load existing storage
  const storage = await loadDiaries(storagePath);

  // Generate ID and timestamps
  const now = new Date().toISOString();
  const newEntry: DiaryEntry = {
    ...entry,
    id: generateEntryId(entry.date),
    createdAt: now,
  };

  // Add to storage
  storage.diaries.push(newEntry);

  // Write back to file
  await writeStorage(storage, storagePath);

  return newEntry;
}

/**
 * Update an existing diary entry
 */
export async function updateDiary(
  id: string,
  updates: Partial<DiaryEntry>,
  storagePath?: string
): Promise<DiaryEntry | null> {
  const storage = await loadDiaries(storagePath);

  const index = storage.diaries.findIndex((entry) => entry.id === id);
  if (index === -1) {
    return null;
  }

  // Validate updates if they include required fields
  validateEntry(updates);

  // Update entry
  const updatedEntry: DiaryEntry = {
    ...storage.diaries[index],
    ...updates,
    id: storage.diaries[index].id, // Preserve original ID
    createdAt: storage.diaries[index].createdAt, // Preserve created date
    updatedAt: new Date().toISOString(),
  };

  storage.diaries[index] = updatedEntry;
  await writeStorage(storage, storagePath);

  return updatedEntry;
}

/**
 * Delete a diary entry
 */
export async function deleteDiary(
  id: string,
  storagePath?: string
): Promise<boolean> {
  const storage = await loadDiaries(storagePath);

  const index = storage.diaries.findIndex((entry) => entry.id === id);
  if (index === -1) {
    return false;
  }

  storage.diaries.splice(index, 1);
  await writeStorage(storage, storagePath);

  return true;
}

// ============================================================================
// Query Operations
// ============================================================================

/**
 * Check if entry matches filter criteria
 */
function matchesFilter(entry: DiaryEntry, filter: DiaryFilterOptions): boolean {
  // Date range filter
  if (filter.startDate && entry.date < filter.startDate) {
    return false;
  }
  if (filter.endDate && entry.date > filter.endDate) {
    return false;
  }

  // Text search (case-insensitive)
  if (filter.searchText) {
    const searchLower = filter.searchText.toLowerCase();
    const textMatch = entry.audioText.toLowerCase().includes(searchLower);
    const promptMatch = entry.prompt.toLowerCase().includes(searchLower);
    if (!textMatch && !promptMatch) {
      return false;
    }
  }

  // Style filter
  if (filter.style && entry.style !== filter.style) {
    return false;
  }

  // Mood filter
  if (filter.mood && entry.mood !== filter.mood) {
    return false;
  }

  return true;
}

/**
 * Sort entries
 */
function sortEntries(
  entries: DiaryEntry[],
  options: DiarySortOptions
): DiaryEntry[] {
  const { field = 'date', order = 'desc' } = options;

  return [...entries].sort((a, b) => {
    const aVal = a[field] || a.createdAt;
    const bVal = b[field] || b.createdAt;

    const comparison = aVal.localeCompare(bVal);
    return order === 'asc' ? comparison : -comparison;
  });
}

/**
 * List all diary entries with optional filter and sort
 */
export async function listDiaries(
  options?: DiaryListOptions,
  storagePath?: string
): Promise<DiaryEntry[]> {
  const storage = await loadDiaries(storagePath);
  let entries = [...storage.diaries];

  // Apply filters
  if (options?.filter) {
    entries = entries.filter((entry) => matchesFilter(entry, options.filter!));
  }

  // Apply sorting
  if (options?.sort) {
    entries = sortEntries(entries, options.sort);
  }

  // Apply limit
  if (options?.limit) {
    entries = entries.slice(0, options.limit);
  }

  return entries;
}

/**
 * Get a single diary entry by ID
 */
export async function getDiaryById(
  id: string,
  storagePath?: string
): Promise<DiaryEntry | null> {
  const storage = await loadDiaries(storagePath);
  return storage.diaries.find((entry) => entry.id === id) || null;
}

/**
 * Search diary entries by text
 */
export async function searchDiaries(
  searchText: string,
  options?: DiaryListOptions,
  storagePath?: string
): Promise<DiaryEntry[]> {
  // Merge searchText into existing filter
  const filter: DiaryFilterOptions = {
    searchText,
    ...options?.filter,
  };

  return listDiaries(
    {
      ...options,
      filter,
    },
    storagePath
  );
}

/**
 * Get diary entries for a specific date
 */
export async function getDiariesByDate(
  date: string,
  storagePath?: string
): Promise<DiaryEntry[]> {
  return listDiaries(
    {
      filter: { startDate: date, endDate: date },
      sort: { field: 'createdAt', order: 'asc' },
    },
    storagePath
  );
}

/**
 * Get storage statistics
 */
export async function getStorageStats(
  storagePath?: string
): Promise<{
  totalEntries: number;
  dateRange: { earliest: string; latest: string } | null;
  styleCounts: Record<string, number>;
}> {
  const storage = await loadDiaries(storagePath);
  const diaries = storage.diaries;

  if (diaries.length === 0) {
    return {
      totalEntries: 0,
      dateRange: null,
      styleCounts: {},
    };
  }

  // Calculate date range
  const sortedByDate = [...diaries].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  // Count styles
  const styleCounts: Record<string, number> = {};
  for (const entry of diaries) {
    if (entry.style) {
      styleCounts[entry.style] = (styleCounts[entry.style] || 0) + 1;
    }
  }

  return {
    totalEntries: diaries.length,
    dateRange: {
      earliest: sortedByDate[0].date,
      latest: sortedByDate[sortedByDate.length - 1].date,
    },
    styleCounts,
  };
}

/**
 * Rebuild storage index (for maintenance)
 */
export async function rebuildIndex(
  storagePath?: string
): Promise<void> {
  const storage = await loadDiaries(storagePath);

  // Sort by date and regenerate IDs
  storage.diaries = storage.diaries
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry, index) => ({
      ...entry,
      id: generateEntryId(entry.date),
    }));

  await writeStorage(storage, storagePath);
}
