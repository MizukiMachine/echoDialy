/**
 * Prompts Module
 * Handles prompt engineering for image generation
 */

export interface DiaryPromptOptions {
  userInput: string;        // Child's spoken content
  style: 'watercolor' | 'crayon' | 'picture-book';
  mood: 'happy' | 'exciting' | 'calm';
  age: number;             // Target age
}

/**
 * Build a prompt for diary image generation
 */
export function buildDiaryPrompt(options: DiaryPromptOptions): string {
  const { userInput, style, mood, age } = options;

  // TODO: Implement prompt engineering
  return `A diary illustration for a ${age}-year-old child: ${userInput}`;
}
