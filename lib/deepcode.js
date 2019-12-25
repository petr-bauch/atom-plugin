'use babel';

import { CompositeDisposable, Disposable } from 'atom';

import { Store } from './modules/Store';
import { PluginManager } from './modules/PluginManager';
import { PLUGIN } from './constants/common';
import { SHARED_STORE_KEYS } from './constants/store';
import { COMMANDS } from './constants/commands';

import { ProblemsPanel } from './views/ProblemsPanel';
import { StatusBarButton } from './views/StatusBarButton';

export default {

  subscriptions: null,
  statusBarButton: null,
  lastStateLog: 0,

  activate(state) {
    console.log('Activate: ', state);
    Store.init(state);

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable(
      // Add an opener for our view
      atom.workspace.addOpener(uri => {
        if (uri === PLUGIN.problemsPanelURI) {
          return new ProblemsPanel();
        }
      }),

      // Register command that toggles this view
      atom.commands.add('atom-workspace', {
        [COMMANDS.openPanel]: () => PluginManager.toggleProblemsPanel(),
      }),

      // Destroy any ProblemsPanel when the package is deactivated
      new Disposable(() => {
        atom.workspace.getPaneItems().forEach(item => {
          if (item instanceof ProblemsPanel) {
            item.destroy();
          }
        });
      })
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

    // Check login and start the rest operations
    PluginManager.checkLogin();
  },

  consumeStatusBar(statusBar) {
    this.statusBarButton = new StatusBarButton();
    this.statusBarButton.init(statusBar);
  },

  serialize() {
    const state = Store.getState();
    const sharedState = SHARED_STORE_KEYS.reduce((res, key) => {
      res[key] = state[key];
      return res;
    }, {});

    const now = new Date();
    if (now - this.lastStateLog > 1000 * 60) {
      console.log('Serialize. State:', state);
      console.log('Serialize. Shared State:', sharedState);
      this.lastStateLog = now;
    }

    return {
      ...sharedState,
    };
  },

  deactivate() {
    this.subscriptions.dispose();

    this.statusBarButton.destroy();
    this.statusBarButton = null;

    PluginManager.destroy();
  },
};
