import React, { PureComponent, lazy, Suspense } from 'react'
import { Route, Switch, BrowserRouter as Router } from 'react-router-dom'
import { configure } from 'react-hotkeys'
import { hot } from 'react-hot-loader/root'

import { OVERLAY_URL, SCREEN_READER_URL, SETTINGS_URL, DEFAULT_OPTIONS, PRESENTER_URL, BACKEND_URL } from './lib/consts'
import { merge } from './lib/utils'
import controller from './lib/controller'

import Overlay from './Overlay'
import Loader from './shared/Loader'

import './App.css'

const ScreenReader = lazy( () => import( './ScreenReader' ) )
const Presenter = lazy( () => import( './Presenter' ) )
const Settings = lazy( () => import( './Settings' ) )

class App extends PureComponent {
  components = [
    [ Overlay, OVERLAY_URL ],
    [ ScreenReader, SCREEN_READER_URL ],
    [ Settings, SETTINGS_URL ],
    [ Presenter, PRESENTER_URL ],
  ].map( ( [ Component, path ] ) => [ props => <Component {...props} {...this.state} />, path ] )

  constructor( props ) {
    super( props )

    // Configure react-hotkeys
    configure( {
      ignoreTags: [],
    } )

    this.state = {
      connected: false,
      banis: [],
      bani: null,
      lineId: null,
      mainLineId: null,
      viewedLines: new Set(),
      transitionHistory: [],
      latestLines: {},
      shabad: null,
      recommendedSources: null,
      status: null,
      settings: merge( { local: controller.readSettings() }, DEFAULT_OPTIONS ),
    }
  }

  componentDidMount() {
    // Register controller event
    controller.on( 'connected', this.onConnected )
    controller.on( 'disconnected', this.onDisconnected )
    controller.on( 'shabads:current', this.onShabad )
    controller.on( 'lines:current', this.onLine )
    controller.on( 'lines:main', this.onMainLine )
    controller.on( 'history:viewed-lines', this.onViewedLines )
    controller.on( 'history:transitions', this.onTransitionHistory )
    controller.on( 'history:latest-lines', this.onLatestLineHistory )
    controller.on( 'banis:list', this.onBanis )
    controller.on( 'banis:current', this.onBani )
    controller.on( 'status', this.onStatus )
    controller.on( 'settings:all', this.onSettings )

    // Get recommended sources and set as settings, if there are none
    const { settings: { local: { sources } } } = this.state
    fetch( `${BACKEND_URL}/sources` )
      .then( res => res.json() )
      .then( ( { recommended: recommendedSources } ) => {
        this.setState( { recommendedSources } )
        controller.setSettings( { sources: merge( recommendedSources, sources ) } )
      } )
  }

  componentWillUnmount() {
    // Deregister event listeners from controller
    controller.off( 'connected', this.onConnected )
    controller.off( 'disconnected', this.onDisconnected )
    controller.off( 'shabads:current', this.onShabad )
    controller.off( 'lines:current', this.onLine )
    controller.off( 'history:transitions', this.onTransitionHistory )
    controller.off( 'history:latest-lines', this.onLatestLineHistory )
    controller.off( 'lines:main', this.onMainLine )
    controller.off( 'lines:viewed', this.onViewedLines )
    controller.off( 'banis:list', this.onBanis )
    controller.off( 'banis:current', this.onBani )
    controller.off( 'status', this.onStatus )
    controller.off( 'settings:all', this.onSettings )
  }

  onConnected = () => this.setState( { connected: true, bani: null, shabad: null } )

  onDisconnected = () => this.setState( { connected: false } )

  onShabad = shabad => this.setState( { shabad, bani: null } )

  onLine = lineId => this.setState( { lineId } )

  onViewedLines = viewedLines => this.setState( { viewedLines } )

  onMainLine = mainLineId => this.setState( { mainLineId } )

  onTransitionHistory = history => this.setState( { transitionHistory: history.reverse() } )

  onLatestLineHistory = latestLines => this.setState( { latestLines } )

  onStatus = status => this.setState( { status } )

  onBanis = banis => this.setState( { banis } )

  onBani = bani => this.setState( { bani, shabad: null } )

  onSettings = ( { global = {}, ...settings } ) => this.setState( state => ( {
    settings: {
      ...state.settings,
      ...settings,
      global: merge( state.settings.global, global ),
    },
  } ) )

  render() {
    return (
      <div className="app">
        <Suspense fallback={<Loader />}>
          <Router>
            <Switch>
              {this.components.map( ( [ Component, path ] ) => (
                <Route key={path} path={path} component={Component} />
              ) )}
            </Switch>
          </Router>
        </Suspense>
      </div>
    )
  }
}

export default hot( App )
