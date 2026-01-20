/**
 * Sentry edge runtime configuration
 * This file configures Sentry for edge runtime (middleware, edge functions)
 */

import * as Sentry from '@sentry/nextjs'
import { initSentry } from './lib/sentry'

initSentry()
