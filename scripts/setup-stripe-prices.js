const Stripe = require('stripe')
require('dotenv').config()

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in .env')
  console.log('\nTo create Stripe products/prices:')
  console.log('1. Get your Stripe Secret Key from: https://dashboard.stripe.com/apikeys')
  console.log('2. Add it to .env: STRIPE_SECRET_KEY=sk_test_xxxxx')
  console.log('3. Run: node scripts/setup-stripe-prices.js\n')
  console.log('OR manually create products in Stripe Dashboard:')
  console.log('- Go to: https://dashboard.stripe.com/products')
  console.log('- Create 3 products ($49 each)')
  console.log('- Copy the Price IDs and add to Vercel\n')
  process.exit(1)
}

if (!STRIPE_SECRET_KEY.startsWith('sk_')) {
  console.error('❌ Invalid Stripe Secret Key format (should start with sk_test_ or sk_live_)')
  process.exit(1)
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
})

const PLANS = [
  {
    name: 'DM Engine',
    description: 'Best for confident, non-cringe DMs',
    price: 4900, // $49.00 in cents
    planId: 'dm_engine',
  },
  {
    name: 'The Strategy',
    description: 'Best for strategic engagement & visibility',
    price: 4900,
    planId: 'the_strategy',
  },
  {
    name: 'All Access',
    description: 'Everything in DM Engine + The Strategy',
    price: 4900,
    planId: 'all_access',
  },
]

async function setupPrices() {
  console.log('📦 Creating Stripe products and prices...\n')

  const priceIds = {}

  for (const plan of PLANS) {
    try {
      // Create product
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
      })
      console.log(`✅ Created product: ${product.name} (${product.id})`)

      // Create price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.price,
        currency: 'usd',
        metadata: {
          planId: plan.planId,
        },
      })
      console.log(`✅ Created price: $${(plan.price / 100).toFixed(2)} (${price.id})\n`)

      priceIds[plan.planId] = price.id
    } catch (error) {
      console.error(`❌ Failed to create ${plan.name}:`, error.message)
    }
  }

  console.log('\n📋 Add these to Vercel Production environment variables:\n')
  console.log('STRIPE_PRICE_ID_DM_ENGINE=' + priceIds.dm_engine)
  console.log('STRIPE_PRICE_ID_THE_STRATEGY=' + priceIds.the_strategy)
  console.log('STRIPE_PRICE_ID_ALL_ACCESS=' + priceIds.all_access)
  console.log('\n✅ Done!')
}

setupPrices().catch(console.error)
