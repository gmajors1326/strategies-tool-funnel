#!/usr/bin/env node

/**
 * Push environment variables to Vercel
 * Usage: node scripts/push-env-to-vercel.js
 */

const fs = require('fs');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function pushEnvToVercel() {
  console.log('🔐 Pushing environment variables to Vercel...\n');

  // Check if .env file exists
  if (!fs.existsSync('.env')) {
    console.error('❌ .env file not found!');
    console.error('Please create a .env file with your environment variables.');
    process.exit(1);
  }

  // Check if Vercel CLI is installed
  try {
    const version = execSync('vercel --version', { encoding: 'utf-8' }).trim();
    console.log(`✅ Vercel CLI found: ${version}\n`);
  } catch (error) {
    console.error('❌ Vercel CLI not found. Install it with: npm i -g vercel');
    process.exit(1);
  }

  // Read .env file
  console.log('📖 Reading .env file...');
  const envContent = fs.readFileSync('.env', 'utf-8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    line = line.trim();
    // Skip empty lines and comments
    if (!line || line.startsWith('#')) return;

    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      let key = match[1].trim();
      let value = match[2].trim();
      // Remove quotes if present
      value = value.replace(/^["'](.*)["']$/, '$1');
      if (key && value) {
        envVars[key] = value;
      }
    }
  });

  if (Object.keys(envVars).length === 0) {
    console.error('❌ No environment variables found in .env file!');
    process.exit(1);
  }

  console.log(`📋 Found ${Object.keys(envVars).length} environment variables\n`);

  // Show variables (hide sensitive ones)
  console.log('The following variables will be pushed to Vercel:');
  Object.keys(envVars).forEach(key => {
    const displayValue = /SECRET|KEY|PASSWORD|TOKEN/i.test(key) 
      ? '***hidden***' 
      : envVars[key];
    console.log(`  ${key} = ${displayValue}`);
  });

  console.log('');
  const confirm = await question('Continue? (y/n) ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('❌ Cancelled');
    process.exit(0);
  }

  // Push each variable
  console.log('\n🚀 Pushing to Vercel...\n');

  let successCount = 0;
  let failCount = 0;

  for (const [key, value] of Object.entries(envVars)) {
    process.stdout.write(`Setting ${key}...`);
    
    try {
      // Try to add the variable
      try {
        execSync(`echo "${value}" | vercel env add ${key} production`, { 
          stdio: 'pipe',
          encoding: 'utf-8'
        });
        console.log(' ✅');
        successCount++;
      } catch (addError) {
        // If it exists, remove and re-add
        try {
          execSync(`vercel env rm ${key} production --yes`, { stdio: 'pipe' });
          execSync(`echo "${value}" | vercel env add ${key} production`, { 
            stdio: 'pipe',
            encoding: 'utf-8'
          });
          console.log(' ✅ (updated)');
          successCount++;
        } catch (updateError) {
          console.log(' ❌ Failed');
          failCount++;
        }
      }
    } catch (error) {
      console.log(` ❌ Error: ${error.message}`);
      failCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`  ✅ Success: ${successCount}`);
  console.log(`  ❌ Failed: ${failCount}`);
  console.log('\n💡 Note: You may need to manually set some variables via Vercel dashboard:');
  console.log('   https://vercel.com/dashboard');
  console.log('\n💡 For interactive setup, run: vercel env add');

  rl.close();
}

pushEnvToVercel().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
