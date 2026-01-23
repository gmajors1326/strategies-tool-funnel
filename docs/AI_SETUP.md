# AI API Key Setup

The AI tools require an OpenAI API key to function. Follow these steps to set it up.

## Local Development

### Step 1: Create `.env.local` file

In the root of your project (`strategy-tools-funnel/`), create a file named `.env.local`:

```bash
# Copy from ENV_TEMPLATE.txt or create new
```

### Step 2: Add your OpenAI API Key

Add this line to your `.env.local` file:

```env
OPENAI_API_KEY="sk-your-actual-api-key-here"
```

### Step 3: Get your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Paste it into your `.env.local` file

### Step 4: Restart your dev server

After adding the key, restart your Next.js dev server:

```bash
npm run dev
```

## Vercel Deployment

### Step 1: Go to Vercel Dashboard

1. Navigate to your project: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**

### Step 2: Add Environment Variable

Add this:

- **Name:** `OPENAI_API_KEY`
- **Value:** `sk-your-actual-api-key-here`
- **Value:** `sk-your-actual-api-key-here`

### Step 3: Select Environments

Make sure to select:
- ✅ Production
- ✅ Preview
- ✅ Development (if you use Vercel for local dev)

### Step 4: Redeploy

After adding the variable:
1. Go to **Deployments** tab
2. Click the **⋯** menu on the latest deployment
3. Click **Redeploy**

Or push a new commit to trigger a redeploy.

## Optional: Configure AI Settings

You can also customize these in your `.env.local` or Vercel environment variables:

```env
# Provider (default: openai)
AI_PROVIDER="openai"

# Model (default: gpt-4-turbo-preview)
AI_MODEL="gpt-4-turbo-preview"

# Temperature (default: 0.2 for deterministic responses)
AI_TEMPERATURE="0.2"

# Max tokens per response (default: 800)
AI_MAX_TOKENS="800"
```

## Troubleshooting

### Error: "OPENAI_API_KEY environment variable is required"

**Local:**
- Make sure `.env.local` exists in the project root
- Make sure the file contains `OPENAI_API_KEY="sk-..."`
- Restart your dev server after adding the key
- Check for typos in the variable name

**Vercel:**
- Go to Settings → Environment Variables
- Verify the variable is set correctly
- Make sure it's enabled for the correct environments
- Redeploy after adding/updating the variable

### Error: "Invalid API Key"

- Make sure your API key starts with `sk-`
- Check that you copied the entire key (no spaces or line breaks)
- Verify the key is active in your OpenAI dashboard
- Make sure you have credits/billing set up in OpenAI

## Security Notes

- ⚠️ **Never commit `.env.local` to git** (it's already in `.gitignore`)
- ⚠️ **Never share your API key publicly**
- ⚠️ **Never commit API keys to GitHub**
- ✅ Use Vercel environment variables for production
- ✅ Rotate keys if accidentally exposed
