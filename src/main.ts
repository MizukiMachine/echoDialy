#!/usr/bin/env node

/**
 * echoDialy - Digital Diary App for Children
 * CLI Entry Point
 */

import { Command } from 'commander';

const program = new Command();

program
  .name('echodialy')
  .description('Digital diary app for children using voice input')
  .version('1.0.0');

program
  .command('record')
  .description('Record a new diary entry via voice input')
  .option('-d, --duration <seconds>', 'Recording duration in seconds', '10')
  .action(async (options) => {
    const { recordVoice, editText } = await import('./voice/index.js');

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error('❌ OPENAI_API_KEY is not set');
      console.log('   Please set it in config/.env or export OPENAI_API_KEY=...');
      process.exit(1);
    }

    const duration = parseInt(options.duration, 10);

    try {
      console.log('\n🎤 echoDialy - 音声日記録音\n');

      // 音声録音＆Whisper APIでテキスト化
      const result = await recordVoice({
        openaiApiKey,
        duration,
      });

      // テキスト確認・編集
      const finalText = await editText(result.text);

      console.log('\n✅ 日記エントリー作成完了！');
      console.log(`   テキスト: "${finalText}"`);
      console.log(`   音声ファイル: ${result.audioPath}`);

    } catch (error) {
      if (error instanceof Error) {
        console.error(`\n❌ エラー: ${error.message}`);
      }
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all diary entries')
  .action(() => {
    console.log('📖 Diary entries:');
    console.log('TODO: Implement list functionality');
  });

program
  .command('generate <text>')
  .description('Generate an image from text (for testing)')
  .option('-s, --style <style>', 'Image style: watercolor, crayon, picture-book')
  .option('-m, --mood <mood>', 'Image mood: happy, exciting, calm')
  .action(async (text: string, options) => {
    const { generateImage, GeminiError } = await import('./ai/index.js');

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.error('❌ GEMINI_API_KEY is not set');
      console.log('   Please set it in config/.env or export GEMINI_API_KEY=...');
      process.exit(1);
    }

    try {
      console.log('\n🎨 echoDialy - 画像生成\n');

      const result = await generateImage(
        {
          prompt: text,
          style: options.style as any,
          mood: options.mood as any,
        },
        {
          apiKey: geminiApiKey,
          enableLogging: true,
        }
      );

      console.log('\n✅ 画像生成完了！');
      console.log(`   プロンプト: "${result.prompt}"`);
      console.log(`   画像パス: ${result.imagePath}`);
      console.log(`   モデル: ${result.modelUsed}`);
      console.log(`   生成時間: ${result.generationTime}ms`);

    } catch (error) {
      if (error instanceof GeminiError) {
        console.error(`\n❌ エラー: ${error.message}`);
        console.error(`   コード: ${error.code}`);
        console.error(`   再試行可能: ${error.retryable ? 'はい' : 'いいえ'}`);
      } else if (error instanceof Error) {
        console.error(`\n❌ エラー: ${error.message}`);
      }
      process.exit(1);
    }
  });

program.parse();
