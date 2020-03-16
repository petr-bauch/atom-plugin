'use babel';

import { CompositeDisposable, Disposable } from 'atom';

import { config } from './config';
import { Store } from './modules/Store';
import { PluginManager } from './modules/PluginManager';
import { CommonUtils } from './modules/CommonUtils';
import { Logger } from './modules/Logger';
import { HttpModule } from './modules/HttpModule';

import { DB } from './modules/Database';
import { PLUGIN } from './constants/common';
import { COMMANDS } from './constants/commands';
import { CUSTOM_EVENTS, STORE_KEYS } from './constants/store';

import { ProblemsPanel } from './views/ProblemsPanel';
import { StatusBarButton } from './views/StatusBarButton';
import { EditorUtils } from './modules/EditorUtils';

export default {

  subscriptions: null,
  statusBarButton: null,
  lastStateLog: 0,

  config,

  async initialize() {
    Logger.init();

    const dbConnected = await DB.init();
    Logger.log(`DB connected: ${dbConnected}`);

    const sharedState = await DB.restoreState(true);
    const projectState = await DB.restoreState();

    Store.init(sharedState, projectState);

    Logger.log('Activating plugin');
    Logger.log('Shared State: ', sharedState);
    Logger.log('Project State: ', projectState);

    // clone some configs into Store and init HTTP module
    CommonUtils.clonePluginConfig();

    const serviceURL = Store.get(STORE_KEYS.serviceURL);
    const debugLog = atom.config.get(`${PLUGIN.name}.debugLog`);
    HttpModule.init({
      baseURL: serviceURL,
      useDebug: debugLog,
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.initSubscriptions();

    // Check login and start the rest operations in queue
    const isLoggedIn = Store.flags.isLoggedIn();
    if (!isLoggedIn) {
      PluginManager.openLoginDialog();
      return;
    }

    PluginManager.checkLogin();
  },

  initSubscriptions() {
    this.subscriptions = new CompositeDisposable(
      // Add an opener for our view
      atom.workspace.addOpener((uri) => {
        if (uri === PLUGIN.problemsPanelURI) {
          return new ProblemsPanel();
        }

        return null;
      }),

      // Register command that toggles this view
      atom.commands.add('atom-workspace', {
        [COMMANDS.openPanel]: () => PluginManager.openProblemsPanel(),
        [COMMANDS.resetPlugin]: () => PluginManager.resetPlugin(),
      }),

      // Destroy any ProblemsPanel when the package is deactivated
      new Disposable(() => {
        atom.workspace.getPaneItems().forEach((item) => {
          if (item instanceof ProblemsPanel) {
            item.destroy();
          }
        });
      }),

      // observe config changes: 'debugLog'
      atom.config.observe(`${PLUGIN.name}.debugLog`, (newValue) => {
        Logger.init();

        const serviceURL = Store.get(STORE_KEYS.serviceURL);
        HttpModule.init({
          baseURL: serviceURL,
          useDebug: newValue,
        });
      }),

      // observe config changes: 'sessionToken'
      atom.config.observe(`${PLUGIN.name}.sessionToken`, (sessionToken) => {
        Store.set(STORE_KEYS.sessionToken, sessionToken);
      }),

      // observe config changes: 'serviceURL'
      atom.config.observe(`${PLUGIN.name}.serviceURL`, (newServiceURL) => {
        Store.emit(CUSTOM_EVENTS.didLogout);
        const debugLog = atom.config.get(`${PLUGIN.name}.debugLog`);
        HttpModule.init({
          baseURL: newServiceURL,
          useDebug: debugLog,
        });
      }),

      // observe changing project paths
      atom.project.onDidChangePaths(projectPaths => {
        PluginManager.didChangePaths(projectPaths);
      }),
    );
  },

  consumeStatusBar(statusBar) {
    this.statusBarButton = new StatusBarButton();
    this.statusBarButton.init(statusBar);
  },

  serialize() {
    const sharedState = Store.getSharedState();

    CommonUtils.saveSharedStore();
    CommonUtils.saveProjectStore();

    const now = new Date();
    if (now - this.lastStateLog > 1000 * 60) {
      const projectState = Store.getProjectState();
      Logger.log('Serialize. Shared State:', sharedState);
      Logger.log('Serialize. Project State:', projectState);
      this.lastStateLog = now;
    }

    return {
      ...sharedState,
    };
  },

  deactivate() {
    if (this.subscriptions) {
      this.subscriptions.dispose();
    }

    if (this.statusBarButton) {
      this.statusBarButton.destroy();
      this.statusBarButton = null;
    }

    EditorUtils.destroy();
    PluginManager.destroy();
    Logger.destroy();
  },

  // Testing API ------------------------------------------------------------------------------------------------------

  getPluginState() {
    return Store.getState();
  },

  setPluginState(state = {}) {
    Store.setMany(state);
  },

  initHTTP(serviceURL) {
    HttpModule.init({
      baseURL: serviceURL,
      useDebug: true,
    });
  },

  checkFilters(testCallback) {
    PluginManager.checkFilters(testCallback);
  },

  async createBundle() {
    return PluginManager.createBundle();
  },

  async createRemoteBundle(bundleId) {
    return PluginManager.createRemoteBundle(bundleId);
  },

  async checkAnalysis(analysisResults) {
    return PluginManager.checkAnalysis(analysisResults);
  },
};
