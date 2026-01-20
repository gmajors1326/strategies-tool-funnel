/**
 * Sentry server-side configuration
 * This file configures Sentry for the server-side code
 */

import * as Sentry from '@sentry/nextjs'
import { initSentry } from './lib/sentry'

initSentry()
