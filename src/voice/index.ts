/**
 * Voice Input Module
 * Handles audio recording and speech-to-text conversion
 */

import OpenAI from 'openai';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export interface VoiceInputResult {
  text: string;
  duration: number;
  timestamp: Date;
  audioPath: string;
}

export interface VoiceOptions {
  openaiApiKey: string;
  outputDir?: string;
  duration?: number; // 録音時間（秒）
}

/**
 * Record audio using system command (arecord for Linux)
 */
async function recordAudio(
  outputPath: string,
  duration: number = 10
): Promise<void> {
  const command = `arecord -f cd -r 16000 -d ${duration} ${outputPath}`;
  await execAsync(command);
}

/**
 * Transcribe audio to text using Whisper API
 */
async function transcribeWithWhisper(
  audioPath: string,
  openaiApiKey: string
): Promise<string> {
  const openai = new OpenAI({ apiKey: openaiApiKey });

  const transcription = await openai.audio.transcriptions.create({
    file: await fs.readFile(audioPath) as any,
    model: 'whisper-1',
    language: 'ja',
  });

  return transcription.text;
}

/**
 * Record audio and convert to text
 */
export async function recordVoice(
  options: VoiceOptions
): Promise<VoiceInputResult> {
  const {
    openaiApiKey,
    outputDir = './data/audio',
    duration = 10,
  } = options;

  // 出力ディレクトリ作成
  await fs.mkdir(outputDir, { recursive: true });

  // 音声ファイルパス生成
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const audioPath = path.join(outputDir, `recording-${timestamp}.wav`);

  console.log(`🎙️  録音を開始します (${duration}秒間)...`);
  console.log('   話してください...');

  const startTime = Date.now();

  // 録音実行
  await recordAudio(audioPath, duration);

  const endTime = Date.now();
  const actualDuration = (endTime - startTime) / 1000;

  console.log(`✓ 録音完了 (${actualDuration.toFixed(1)}秒)`);

  // Whisper APIでテキスト化
  console.log('🔄 音声をテキストに変換中...');
  const text = await transcribeWithWhisper(audioPath, openaiApiKey);

  console.log(`✓ 変換完了:`);
  console.log(`   "${text}"`);

  return {
    text,
    duration: actualDuration,
    timestamp: new Date(),
    audioPath,
  };
}

/**
 * Allow user to edit the transcribed text
 */
export async function editText(originalText: string): Promise<string> {
  console.log('\n📝 テキスト編集:');
  console.log(`現在: "${originalText}"`);
  console.log('編集する場合は新しいテキストを入力（Enterでそのまま使用）');

  // 簡易実装：標準入力から読み取り
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('>>> ', (answer: string) => {
      rl.close();
      resolve(answer.trim() || originalText);
    });
  });
}
