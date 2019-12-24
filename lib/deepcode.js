'use babel';

import { CompositeDisposable, Disposable } from 'atom';

import { Store } from './modules/Store';
import { PluginManager } from './modules/PluginManager';
import { PLUGIN } from './constants/common';
import { STORE_KEYS } from './constants/store';
import { COMMANDS } from './constants/commands';

import { ProblemsPanel } from './views/ProblemsPanel';
import { StatusBarButton } from './views/StatusBarButton';

export default {

  subscriptions: null,
  statusBarTile: null,
  statusBarButton: null,

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
    this.statusBarTile = statusBar.addRightTile({
      item: this.statusBarButton.getElement(),
    });
  },

  serialize() {
    const state = Store.getState();
    console.log('Serialize:', state);

    return {
      ...state,
    };
  },

  deactivate() {
    this.subscriptions.dispose();

    this.statusBarButton.destroy();
    this.statusBarButton = null;

    this.statusBarTile.destroy()
    this.statusBarTile = null;
  },
};
