# Fix OpenAI Quota/Billing Error (429)

If you're getting a "429 You exceeded your current quota" error but see $0.00 usage in your OpenAI dashboard, this usually means your account needs billing setup.

## Quick Fix Steps

### Step 1: Check Your OpenAI Account Billing

1. Go to: https://platform.openai.com/account/billing
2. Sign in with the same account that created your API key

### Step 2: Add a Payment Method

1. In the billing page, click **"Add payment method"**
2. Enter your credit card details
3. Save the payment method

### Step 3: Check Spending Limits

1. Still on the billing page, look for **"Spending limits"** or **"Usage limits"**
2. Make sure you have a limit set (e.g., $10, $50, $100)
3. If it's set to $0, increase it to at least $5-10 for testing

### Step 4: Verify Your API Key

1. Go to: https://platform.openai.com/api-keys
2. Make sure your API key is active (not revoked)
3. If needed, create a new API key and update your `.env.local` or Vercel environment variables

### Step 5: Test Again

After setting up billing:
1. Wait 1-2 minutes for changes to propagate
2. Try running the tool again
3. Check your usage dashboard to confirm requests are being recorded

## Common Issues

### Issue: "No payment method" error
**Solution:** Add a credit card in OpenAI billing settings

### Issue: Spending limit is $0
**Solution:** Increase spending limit to at least $5-10

### Issue: Free tier expired
**Solution:** OpenAI free credits expire. Add a payment method to continue using the API.

### Issue: API key from different account
**Solution:** Make sure your API key matches the account with billing set up

## Cost Estimates

For reference, typical costs per tool run:
- **gpt-4-turbo-preview**: ~$0.01-0.03 per request (depending on input/output length)
- **gpt-3.5-turbo**: ~$0.001-0.002 per request

With a $10 spending limit, you can run hundreds of tool analyses.

## Still Having Issues?

1. Check OpenAI status: https://status.openai.com/
2. Review OpenAI error codes: https://platform.openai.com/docs/guides/error-codes
3. Contact OpenAI support if billing is set up but still getting errors
