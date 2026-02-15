/**
 * Prompts Module - Prompt Engineering
 * Handles prompt design and template management for image generation
 *
 * Design Principles:
 * 1. Prompt Engineering: Optimizing prompts for better image generation
 * 2. Template System: Reusable prompt templates with parameters
 * 3. Parameter Design: Type-safe parameters with validation
 * 4. A/B Testing: Compare multiple prompt variations
 * 5. Age-Appropriate: Adjust expression based on target age
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Available art styles for diary illustrations
 */
export type ArtStyle = 'watercolor' | 'crayon' | 'picture-book' | 'anime' | 'pastel';

/**
 * Available mood atmospheres
 */
export type Mood = 'happy' | 'exciting' | 'calm' | 'nostalgic' | 'warm';

/**
 * Prompt quality metrics for A/B testing
 */
export interface PromptMetrics {
  promptVersion: string;
  generatedAt: Date;
  parameters: DiaryPromptOptions;
  result?: {
    imagePath: string;
    userRating?: number; // 1-5 stars
    generationTime: number;
  };
}

/**
 * Core diary prompt options
 */
export interface DiaryPromptOptions {
  userInput: string;           // Child's spoken content
  style?: ArtStyle;             // Art style
  mood?: Mood;                  // Atmosphere/mood
  age?: number;                 // Target age (default: 5)
  detailLevel?: 'simple' | 'normal' | 'detailed';  // Detail level
  aspectRatio?: '1:1' | '4:3' | '16:9';           // Aspect ratio
}

/**
 * A/B test configuration
 */
export interface PromptExperimentConfig {
  basePrompt: DiaryPromptOptions;
  variations: Partial<DiaryPromptOptions>[];  // Parameters to vary
  maxVariations?: number;
}

// ============================================================================
// Prompt Templates
// ============================================================================

/**
 * Base prompt template interface
 */
export interface PromptTemplate {
  name: string;
  description: string;
  template: string;
  defaultParameters: Partial<DiaryPromptOptions>;
}

/**
 * Built-in prompt templates
 */
export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  /**
   * Simple template for younger children (3-5 years)
   */
  simple: {
    name: 'simple',
    description: 'Simple illustration for young children',
    template: `子供の絵日記のイラスト：{{userInput}}。明るくて親しみやすいスタイルで。`,
    defaultParameters: {
      age: 4,
      detailLevel: 'simple',
      style: 'crayon',
      mood: 'happy',
    },
  },

  /**
   * Standard template for middle children (6-8 years)
   */
  standard: {
    name: 'standard',
    description: 'Standard illustration for elementary school children',
    template: `絵日風のイラスト：{{userInput}}。{{styleDescription}}で{{moodDescription}}雰囲気を表現。`,
    defaultParameters: {
      age: 7,
      detailLevel: 'normal',
      style: 'watercolor',
      mood: 'happy',
    },
  },

  /**
   * Detailed template for older children (9-12 years)
   */
  detailed: {
    name: 'detailed',
    description: 'Detailed illustration with artistic expression',
    template: `芸術的な絵日記イラスト：{{userInput}}。{{styleDescription}}の画風で、{{moodDescription}}雰囲気を繊細に表現。子供の心象を大切にした温かみのある表現。`,
    defaultParameters: {
      age: 10,
      detailLevel: 'detailed',
      style: 'watercolor',
      mood: 'warm',
    },
  },

  /**
   * Picture book style template
   */
  pictureBook: {
    name: 'picture-book',
    description: 'Picture book style illustration',
    template: `絵本のイラスト：{{userInput}}。{{styleDescription}}で描かれた、子供が見ても楽しくなるような表現。{{moodDescription}}。`,
    defaultParameters: {
      age: 6,
      detailLevel: 'normal',
      style: 'picture-book',
      mood: 'exciting',
    },
  },
};

// ============================================================================
// Prompt Builder
// ============================================================================

/**
 * Style description mappings
 */
const STYLE_DESCRIPTIONS: Record<ArtStyle, string> = {
  'watercolor': '水彩画風のやわらかいタッチ',
  'crayon': 'クレヨンで描いたような無邪なタッチ',
  'picture-book': '絵本風の温かみのあるイラスト',
  'anime': 'アニメ風のきらきらした表現',
  'pastel': 'パステルカラーの柔らかい色使い',
};

/**
 * Mood description mappings
 */
const MOOD_DESCRIPTIONS: Record<Mood, string> = {
  'happy': '楽しそな',
  'exciting': 'わくわくする',
  'calm': '穏やかな',
  'nostalgic': '懐かしい',
  'warm': '温かみのある',
};

/**
 * Age-appropriate expressions
 */
function getAgeExpression(age: number): string {
  if (age <= 3) return '幼児向けのシンプルで分かりやすい表現';
  if (age <= 6) return '未就学児向けの親しみやすい表現';
  if (age <= 9) return '小学生向けの楽しい表現';
  return '年齢に応じた適切な表現';
}

/**
 * Build prompt with parameters and template
 */
export class PromptBuilder {
  private options: Required<DiaryPromptOptions>;

  constructor(options: DiaryPromptOptions) {
    this.options = {
      userInput: options.userInput,
      style: options.style ?? 'watercolor',
      mood: options.mood ?? 'happy',
      age: options.age ?? 5,
      detailLevel: options.detailLevel ?? 'normal',
      aspectRatio: options.aspectRatio ?? '4:3',
    };
  }

  /**
   * Build style description
   */
  private buildStyleDescription(): string {
    return STYLE_DESCRIPTIONS[this.options.style];
  }

  /**
   * Build mood description
   */
  private buildMoodDescription(): string {
    return MOOD_DESCRIPTIONS[this.options.mood];
  }

  /**
   * Build age-appropriate instructions
   */
  private buildAgeInstructions(): string {
    const ageExpr = getAgeExpression(this.options.age);

    // Detail level adjustments based on age
    let detailInstructions = '';
    switch (this.options.detailLevel) {
      case 'simple':
        detailInstructions = 'シンプルで分かりやすい構図';
        break;
      case 'detailed':
        detailInstructions = '繊細なディテールまで表現';
        break;
      default:
        detailInstructions = 'バランスの取れた構図';
    }

    return `${ageExpr}、${detailInstructions}。`;
  }

  /**
   * Build aspect ratio instruction
   */
  private buildAspectRatioInstruction(): string {
    const ratioMap: Record<string, string> = {
      '1:1': '正方形の構図',
      '4:3': '4:3の横長の構図',
      '16:9': '16:9のワイドスクイン構図',
    };
    return ratioMap[this.options.aspectRatio];
  }

  /**
   * Build final prompt using template
   */
  build(template: PromptTemplate = PROMPT_TEMPLATES.standard): string {
    let prompt = template.template;

    // Replace placeholders
    prompt = prompt.replace(/\{\{userInput\}\}/g, this.options.userInput);
    prompt = prompt.replace(/\{\{styleDescription\}\}/g, this.buildStyleDescription());
    prompt = prompt.replace(/\{\{moodDescription\}\}/g, this.buildMoodDescription());

    // Add technical instructions at the end
    const technicalInstructions = [
      this.buildAgeInstructions(),
      this.buildAspectRatioInstruction(),
    ].join('、');

    return `${prompt} ${technicalInstructions}`;
  }

  /**
   * Get current options
   */
  getOptions(): Required<DiaryPromptOptions> {
    return this.options;
  }
}

// ============================================================================
// A/B Testing
// ============================================================================

/**
 * Prompt experiment result for A/B testing
 */
export interface PromptExperimentResult {
  experimentId: string;
  timestamp: Date;
  basePrompt: string;
  variations: {
    prompt: string;
    parameters: DiaryPromptOptions;
    version: string;
  }[];
}

/**
 * Prompt Experiment Manager
 * Handles A/B testing of different prompt variations
 */
export class PromptExperiment {
  private config: PromptExperimentConfig;
  private experimentId: string;

  constructor(config: PromptExperimentConfig) {
    this.config = config;
    this.experimentId = `exp-${Date.now()}`;
  }

  /**
   * Generate prompt variations for A/B testing
   */
  generateVariations(): PromptExperimentResult {
    const variations: PromptExperimentResult['variations'] = [];

    // Add base prompt
    const baseBuilder = new PromptBuilder(this.config.basePrompt);
    variations.push({
      prompt: baseBuilder.build(),
      parameters: this.config.basePrompt,
      version: 'base',
    });

    // Generate variations
    const maxVariations = this.config.maxVariations ?? this.config.variations.length;

    for (let i = 0; i < Math.min(this.config.variations.length, maxVariations); i++) {
      const variationParams = {
        ...this.config.basePrompt,
        ...this.config.variations[i],
      };

      const builder = new PromptBuilder(variationParams);
      variations.push({
        prompt: builder.build(),
        parameters: variationParams,
        version: `variation-${i + 1}`,
      });
    }

    return {
      experimentId: this.experimentId,
      timestamp: new Date(),
      basePrompt: baseBuilder.build(),
      variations,
    };
  }

  /**
   * Get experiment ID
   */
  getExperimentId(): string {
    return this.experimentId;
  }
}

// ============================================================================
// Public API Functions
// ============================================================================

/**
 * Build a diary prompt with given options
 */
export function buildDiaryPrompt(
  options: DiaryPromptOptions,
  templateName?: string
): string {
  const template = templateName
    ? PROMPT_TEMPLATES[templateName]
    : PROMPT_TEMPLATES.standard;

  const builder = new PromptBuilder(options);
  return builder.build(template);
}

/**
 * Get available prompt templates
 */
export function getAvailableTemplates(): Record<string, PromptTemplate> {
  return PROMPT_TEMPLATES;
}

/**
 * Create an A/B test experiment
 */
export function createExperiment(config: PromptExperimentConfig): PromptExperiment {
  return new PromptExperiment(config);
}

/**
 * Validate prompt options
 */
export function validatePromptOptions(options: DiaryPromptOptions): boolean {
  if (!options.userInput || options.userInput.trim().length === 0) {
    return false;
  }

  if (options.age !== undefined && (options.age < 1 || options.age > 18)) {
    return false;
  }

  return true;
}
