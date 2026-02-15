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

program
  .command('prompts:test <text>')
  .description('Test prompt engineering (show generated prompts)')
  .option('-t, --template <name>', 'Template: simple, standard, detailed, pictureBook', 'standard')
  .option('-s, --style <style>', 'Style: watercolor, crayon, picture-book, anime, pastel')
  .option('-m, --mood <mood>', 'Mood: happy, exciting, calm, nostalgic, warm')
  .option('-a, --age <number>', 'Target age', '5')
  .option('--ab', 'Enable A/B testing mode')
  .action(async (text: string, options) => {
    const {
      buildDiaryPrompt,
      PromptExperiment,
      getAvailableTemplates,
      validatePromptOptions,
    } = await import('./prompts/index.js');

    try {
      console.log('\n📝 echoDialy - プロンプトエンジニアリング\n');

      const promptOptions = {
        userInput: text,
        style: options.style as any,
        mood: options.mood as any,
        age: parseInt(options.age, 10),
      };

      // Validation
      if (!validatePromptOptions(promptOptions)) {
        console.error('❌ Invalid prompt options');
        process.exit(1);
      }

      if (options.ab) {
        // A/B Testing mode
        console.log('🔬 A/Bテストモード\n');

        const experiment = new PromptExperiment({
          basePrompt: promptOptions,
          variations: [
            { style: 'watercolor' },
            { style: 'crayon' },
            { style: 'picture-book' },
          ],
          maxVariations: 3,
        });

        const result = experiment.generateVariations();

        console.log(`Experiment ID: ${result.experimentId}`);
        console.log(`Timestamp: ${result.timestamp}\n`);

        result.variations.forEach((v, i) => {
          console.log(`--- ${v.version} ---`);
          console.log(v.prompt);
          console.log();
        });

      } else {
        // Single prompt mode
        const template = getAvailableTemplates()[options.template];
        if (!template) {
          console.error(`❌ Template "${options.template}" not found`);
          process.exit(1);
        }

        const prompt = buildDiaryPrompt(promptOptions, options.template);

        console.log(`Template: ${template.name}`);
        console.log(`Description: ${template.description}\n`);
        console.log('Generated Prompt:');
        console.log('---');
        console.log(prompt);
        console.log('---');
      }

    } catch (error) {
      if (error instanceof Error) {
        console.error(`\n❌ エラー: ${error.message}`);
      }
      process.exit(1);
    }
  });

program.parse();
