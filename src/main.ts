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
  .action((text: string) => {
    console.log(`🎨 Generating image for: "${text}"`);
    console.log('TODO: Implement Gemini integration');
  });

program.parse();
