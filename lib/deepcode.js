'use babel';

import { CompositeDisposable, Disposable } from 'atom';

import { config } from './config';
import { Store } from './modules/Store';
import { PluginManager } from './modules/PluginManager';
import { CommonUtils } from './modules/CommonUtils';

import { DB } from './modules/Database';
import { PLUGIN } from './constants/common';
import { COMMANDS } from './constants/commands';

import { ProblemsPanel } from './views/ProblemsPanel';
import { StatusBarButton } from './views/StatusBarButton';
import { EditorUtils } from './modules/EditorUtils';

export default {

  subscriptions: null,
  statusBarButton: null,
  lastStateLog: 0,

  config,

  async initialize(sharedState) {
    const dbConnected = await DB.init();
    console.log(`DB connected: ${dbConnected}`);

    const projectState = await DB.restoreState();
    Store.init(sharedState, projectState);

    console.log('Activating plugin');
    console.log('Shared State: ', sharedState);
    console.log('Project State: ', projectState);

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
        [COMMANDS.openPanel]: () => PluginManager.toggleProblemsPanel(),
      }),

      // Destroy any ProblemsPanel when the package is deactivated
      new Disposable(() => {
        atom.workspace.getPaneItems().forEach((item) => {
          if (item instanceof ProblemsPanel) {
            item.destroy();
          }
        });
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
      console.log('Serialize. Shared State:', sharedState);
      console.log('Serialize. Project State:', projectState);
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

    EditorUtils.destroy();
    PluginManager.destroy();
  },
};
