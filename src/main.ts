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
  .option('-s, --search <text>', 'Search text in entries')
  .option('-d, --date <date>', 'Filter by date (YYYY-MM-DD)')
  .option('-S, --style <style>', 'Filter by art style')
  .option('-m, --mood <mood>', 'Filter by mood')
  .option('--sort <field>', 'Sort by field: date, createdAt')
  .option('--order <order>', 'Sort order: asc, desc', 'desc')
  .option('-n, --limit <number>', 'Limit number of results')
  .action(async (options) => {
    const {
      listDiaries,
      searchDiaries,
      getDiariesByDate,
      getStorageStats,
    } = await import('./storage/index.js');

    try {
      console.log('\n📖 echoDialy - 日記一覧\n');

      let entries;

      if (options.search) {
        // Search mode
        entries = await searchDiaries(options.search, {
          filter: {
            startDate: options.date,
            style: options.style,
            mood: options.mood,
          },
          sort: options.sort || options.order ? {
            field: options.sort as any,
            order: options.order as any,
          } : undefined,
          limit: options.limit ? parseInt(options.limit, 10) : undefined,
        });
        console.log(`🔍 検索結果: "${options.search}"\n`);

      } else if (options.date) {
        // Date filter mode
        entries = await getDiariesByDate(options.date);
        console.log(`📅 ${options.date}の日記\n`);

      } else {
        // List all with filters
        entries = await listDiaries({
          filter: {
            startDate: options.date,
            style: options.style,
            mood: options.mood,
          },
          sort: options.sort || options.order ? {
            field: options.sort as any,
            order: options.order as any,
          } : undefined,
          limit: options.limit ? parseInt(options.limit, 10) : undefined,
        });
        console.log('全日記\n');
      }

      if (entries.length === 0) {
        console.log('日記が見つかりませんでした。');
      } else {
        // Display entries
        entries.forEach((entry, index) => {
          console.log(`--- [${index + 1}] ${entry.id} ---`);
          console.log(`日付: ${entry.date}`);
          console.log(`内容: ${entry.audioText}`);
          if (entry.style) console.log(`スタイル: ${entry.style}`);
          if (entry.mood) console.log(`雰囲気: ${entry.mood}`);
          console.log(`画像: ${entry.imagePath}`);
          console.log(`作成日時: ${entry.createdAt}`);
          console.log();
        });

        // Show stats
        const stats = await getStorageStats();
        console.log(`--- 統計 ---`);
        console.log(`総エントリー数: ${stats.totalEntries}`);
        if (stats.dateRange) {
          console.log(`日付範囲: ${stats.dateRange.earliest} ~ ${stats.dateRange.latest}`);
        }
        if (Object.keys(stats.styleCounts).length > 0) {
          console.log('スタイル別件数:');
          Object.entries(stats.styleCounts).forEach(([style, count]) => {
            console.log(`  ${style}: ${count}件`);
          });
        }
      }

    } catch (error) {
      if (error instanceof Error) {
        console.error(`\n❌ エラー: ${error.message}`);
      }
      process.exit(1);
    }
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
