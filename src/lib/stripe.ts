import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export const getStripePublishableKey = () => {
  if (!process.env.STRIPE_PUBLISHABLE_KEY) {
    throw new Error('STRIPE_PUBLISHABLE_KEY is not set')
  }
  return process.env.STRIPE_PUBLISHABLE_KEY
}

export const getApplePayMerchantId = () => {
  return process.env.APPLE_PAY_MERCHANT_ID || 'merchant.com.betthefriend'
}
