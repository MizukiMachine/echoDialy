/**
 * AI Module - Gemini API Harness
 * Handles communication with Gemini 3 Pro Image Preview API
 *
 * Design Principles:
 * 1. Abstraction: API client encapsulated in GeminiClient class
 * 2. Type Safety: Strongly typed request/response interfaces
 * 3. Retry Strategy: Exponential backoff with max retries
 * 4. Error Handling: Custom error classes for different failure types
 * 5. Logging: Debug/info/error level logging functions
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Image generation options
 */
export interface GenerateImageOptions {
  prompt: string;
  style?: 'watercolor' | 'crayon' | 'picture-book';
  mood?: 'happy' | 'exciting' | 'calm';
}

/**
 * Image generation result
 */
export interface GenerateImageResult {
  imagePath: string;
  prompt: string;
  timestamp: Date;
  modelUsed: string;
  generationTime: number; // milliseconds
}

/**
 * Gemini API request configuration
 */
export interface GeminiClientConfig {
  apiKey: string;
  model?: string;
  maxRetries?: number;
  retryDelay?: number; // initial delay in ms
  timeout?: number; // request timeout in ms
  enableLogging?: boolean;
}

/**
 * Gemini API response (simplified for image generation)
 */
export interface GeminiImageResponse {
  success: boolean;
  imageData?: string; // base64 encoded
  errorMessage?: string;
  model?: string;
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Base error class for Gemini API errors
 */
export class GeminiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

/**
 * API key authentication error
 */
export class GeminiAuthError extends GeminiError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', false);
    this.name = 'GeminiAuthError';
  }
}

/**
 * Rate limit error (retryable)
 */
export class GeminiRateLimitError extends GeminiError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT', true);
    this.name = 'GeminiRateLimitError';
  }
}

/**
 * Network error (retryable)
 */
export class GeminiNetworkError extends GeminiError {
  constructor(message: string = 'Network error occurred') {
    super(message, 'NETWORK_ERROR', true);
    this.name = 'GeminiNetworkError';
  }
}

/**
 * Invalid request error (not retryable)
 */
export class GeminiRequestError extends GeminiError {
  constructor(message: string = 'Invalid request') {
    super(message, 'REQUEST_ERROR', false);
    this.name = 'GeminiRequestError';
  }
}

// ============================================================================
// Logging
// ============================================================================

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }
}

// ============================================================================
// Gemini Client (Main Harness)
// ============================================================================

/**
 * Gemini API Client with retry logic and error handling
 */
export class GeminiClient {
  private config: Required<GeminiClientConfig>;
  private logger: Logger;

  constructor(config: GeminiClientConfig) {
    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'gemini-3-pro-image-preview',
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      timeout: config.timeout ?? 30000,
      enableLogging: config.enableLogging ?? true,
    };
    this.logger = new Logger(
      this.config.enableLogging ? LogLevel.DEBUG : LogLevel.ERROR
    );
  }

  /**
   * Sleep for specified milliseconds
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Exponential backoff calculation
   */
  private calculateBackoff(attempt: number): number {
    return this.config.retryDelay * Math.pow(2, attempt);
  }

  /**
   * Build prompt with style and mood
   */
  private buildPrompt(options: GenerateImageOptions): string {
    const { prompt, style, mood } = options;

    let enhancedPrompt = prompt;

    if (style) {
      const styleMap = {
        'watercolor': '水彩画風の',
        'crayon': 'クレヨン画風の',
        'picture-book': '絵本風の',
      };
      enhancedPrompt = `${styleMap[style]}${enhancedPrompt}`;
    }

    if (mood) {
      const moodMap = {
        'happy': '楽しそな',
        'exciting': 'わくわくする',
        'calm': '穏やかな',
      };
      enhancedPrompt = `${moodMap[mood]}雰囲気の${enhancedPrompt}`;
    }

    return enhancedPrompt;
  }

  /**
   * Call Gemini API with retry logic
   */
  private async callApi(
    prompt: string,
    attempt: number = 0
  ): Promise<GeminiImageResponse> {
    this.logger.debug(`API call attempt ${attempt + 1}/${this.config.maxRetries + 1}`);

    try {
      // TODO: Implement actual API call to Gemini 3 Pro Image Preview
      // For now, return a mock response
      //
      // The actual implementation would be:
      // const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-3-pro-image-preview:generateImage', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${this.config.apiKey}`,
      //   },
      //   body: JSON.stringify({ prompt }),
      //   signal: AbortSignal.timeout(this.config.timeout),
      // });

      this.logger.info(`Calling Gemini API with model: ${this.config.model}`);

      // Mock response for development
      return {
        success: true,
        imageData: 'base64_mock_image_data',
        model: this.config.model,
      };

    } catch (error) {
      if (error instanceof Error) {
        // Analyze error and throw appropriate error type
        if (error.message.includes('401') || error.message.includes('403')) {
          throw new GeminiAuthError('Invalid API key');
        }
        if (error.message.includes('429')) {
          throw new GeminiRateLimitError();
        }
        if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
          throw new GeminiNetworkError(error.message);
        }
        throw new GeminiRequestError(error.message);
      }
      throw new GeminiRequestError('Unknown error occurred');
    }
  }

  /**
   * Generate image with retry logic
   */
  async generateImage(options: GenerateImageOptions): Promise<GeminiImageResponse> {
    const prompt = this.buildPrompt(options);
    this.logger.info(`Generating image with prompt: "${prompt}"`);

    let lastError: GeminiError | undefined;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await this.callApi(prompt, attempt);

        if (response.success && response.imageData) {
          this.logger.info('Image generation successful');
          return response;
        }

        throw new GeminiRequestError('API returned unsuccessful response');

      } catch (error) {
        if (error instanceof GeminiError) {
          lastError = error;
          this.logger.warn(`Attempt ${attempt + 1} failed: ${error.message} (code: ${error.code})`);

          // Don't retry if error is not retryable
          if (!error.retryable || attempt === this.config.maxRetries) {
            this.logger.error('Max retries reached or error not retryable');
            throw error;
          }

          // Exponential backoff
          const backoffDelay = this.calculateBackoff(attempt);
          this.logger.info(`Retrying after ${backoffDelay}ms...`);
          await this.sleep(backoffDelay);
        } else {
          throw error;
        }
      }
    }

    // Should never reach here, but TypeScript needs it
    throw lastError || new GeminiRequestError('Unknown error');
  }
}

// ============================================================================
// Public API Functions
// ============================================================================

/**
 * Generate an image using Gemini 3 Pro Image Preview
 * This is the main entry point for the AI module
 */
export async function generateImage(
  options: GenerateImageOptions,
  config?: GeminiClientConfig
): Promise<GenerateImageResult> {
  // Get API key from config or environment
  const apiKey = config?.apiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new GeminiAuthError('GEMINI_API_KEY is not set');
  }

  const startTime = Date.now();
  const client = new GeminiClient({ apiKey, ...config });

  try {
    const response = await client.generateImage(options);
    const generationTime = Date.now() - startTime;

    // TODO: Save image data to file
    // For now, use a mock path
    const imagePath = `./data/images/${Date.now()}.png`;

    return {
      imagePath,
      prompt: options.prompt,
      timestamp: new Date(),
      modelUsed: response.model || 'unknown',
      generationTime,
    };
  } catch (error) {
    if (error instanceof GeminiError) {
      throw error;
    }
    throw new GeminiRequestError('Image generation failed');
  }
}
