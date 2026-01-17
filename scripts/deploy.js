#!/usr/bin/env node

/**
 * Deploy script for Strategy Tools Funnel
 * Automates git commit and push, which triggers Vercel auto-deployment
 * 
 * Usage:
 *   npm run deploy [commit-message]
 *   node scripts/deploy.js "Your commit message"
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function deploy() {
  const commitMessage = process.argv[2] || 'Update: Automated deployment';

  try {
    console.log('🚀 Starting deployment process...\n');

    // Check current branch
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
    
    if (currentBranch !== 'main') {
      console.log(`⚠️  Warning: Not on main branch (currently on ${currentBranch})`);
      const answer = await question('Continue anyway? (y/n) ');
      if (answer.toLowerCase() !== 'y') {
        console.log('❌ Deployment cancelled');
        process.exit(1);
      }
    }

    // Check for uncommitted changes
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    
    if (status.trim()) {
      console.log('📝 Staging changes...');
      execSync('git add .', { stdio: 'inherit' });
      
      console.log('💾 Committing changes...');
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
    } else {
      console.log('✅ No changes to commit');
    }

    // Push to GitHub
    console.log('📤 Pushing to GitHub...');
    execSync('git push origin main', { stdio: 'inherit' });

    console.log('\n✅ Pushed to GitHub successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Vercel will automatically deploy on push to main');
    console.log('   2. Monitor deployment at: https://vercel.com/dashboard');
    console.log('   3. Check GitHub Actions: https://github.com/gmajors1326/strategies-tool-funnel/actions');
    console.log('\n🎉 Deployment initiated!');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

deploy();
