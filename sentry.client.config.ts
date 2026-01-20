/**
 * Sentry client-side configuration
 * This file configures Sentry for the browser/client-side code
 */

import * as Sentry from '@sentry/nextjs'
import { initSentry } from './lib/sentry'

initSentry()
