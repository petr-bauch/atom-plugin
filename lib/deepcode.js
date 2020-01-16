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

import { ProblemsPanel } from './views/ProblemsPanel';
import { StatusBarButton } from './views/StatusBarButton';
import { EditorUtils } from './modules/EditorUtils';
import { STORE_KEYS } from './constants/store';

export default {

  subscriptions: null,
  statusBarButton: null,
  lastStateLog: 0,

  config,

  async initialize(sharedState) {
    const dbConnected = await DB.init();
    Logger.log(`DB connected: ${dbConnected}`);

    const projectState = await DB.restoreState();
    Store.init(sharedState, projectState);

    Logger.log('Activating plugin');
    Logger.log('Shared State: ', sharedState);
    Logger.log('Project State: ', projectState);

    // clone some configs into Store and init HTTP module
    CommonUtils.clonePluginConfig();

    const serviceURL = Store.get(STORE_KEYS.serviceURL);
    HttpModule.init(serviceURL);

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
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
      }),

      // Destroy any ProblemsPanel when the package is deactivated
      new Disposable(() => {
        atom.workspace.getPaneItems().forEach((item) => {
          if (item instanceof ProblemsPanel) {
            item.destroy();
          }
        });
      }),

      // observe config changes: 'analyseOnChange'
      atom.config.observe(`${PLUGIN.name}.analyseOnChange`, () => {
        PluginManager.didUpdateConfigAnalyseOnChange();
      }),

      // observe config changes: 'sessionToken'
      atom.config.observe(`${PLUGIN.name}.sessionToken`, (sessionToken) => {
        const accountType = Store.get(STORE_KEYS.accountType);
        if (sessionToken === '' && accountType !== '') {
          PluginManager.resetPlugin();
        }
      }),

      // observe config changes: 'serviceURL'
      atom.config.observe(`${PLUGIN.name}.serviceURL`, (newServiceURL) => {
        HttpModule.init(newServiceURL);
      }),
    );

    // Main work-flow
    const isConfigured = Store.flags.isConfigured();
    if (!isConfigured) {
      PluginManager.openConfigureDialog();
      return;
    }

    const isLoggedIn = Store.flags.isLoggedIn();
    if (!isLoggedIn) {
      PluginManager.openLoginDialog();
      return;
    }

    // Check login and start the rest operations in queue
    PluginManager.checkLogin();
  },

  consumeStatusBar(statusBar) {
    this.statusBarButton = new StatusBarButton();
    this.statusBarButton.init(statusBar);
  },

  serialize() {
    const sharedState = Store.getSharedState();
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
  },

  // Testing utils ----------------------------------------------------------------------------------------------------

  getPluginState() {
    return Store.getState();
  },

  setPluginState(state = {}) {
    Store.setMany(state);
  },

  initHTTP(serviceURL) {
    HttpModule.init(serviceURL);
  },
};
