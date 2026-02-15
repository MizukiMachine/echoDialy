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
  .action(() => {
    console.log('🎙️  Recording diary entry...');
    console.log('TODO: Implement voice recording');
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
