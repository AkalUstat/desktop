/**
 * Analytics, including error reporting.
 * @ignore
 */

/* eslint-disable class-methods-use-this */
import * as Sentry from '@sentry/node'

import logger from './logger'
import settings from './settings'
import { SENTRY_DSN, isDev } from './consts'

/**
 * Analytics class for tracking events and providing error reporting.
 */
class Analytics {
  /**
   * Initialises the analytics class.
   * Loads Sentry.
   */
  initialise() {
    if ( isDev || !settings.get( 'system.serverAnalytics' ) ) return

    this.initSentry()
  }

  /**
   * Initialises Sentry error reporting.
   * ! Cannot be disabled without a restart.
   */
  initSentry() {
    logger.info( 'Enabling Sentry error reporting' )
    Sentry.init( { dsn: SENTRY_DSN } )
  }

  sendException( error ) {
    Sentry.withScope( scope => {
      scope.setExtra( 'settings', settings.get() )
      Sentry.captureException( error )
    } )
  }
}

export default new Analytics()
