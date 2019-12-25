'use babel';

import { Store } from './Store';
import { HttpModule } from './HttpModule';
import { AuthModule } from './AuthModule';
import { FileUtils } from './FileUtils';

import { FileWatcher } from '../watchers/FileWatcher';

import { PLUGIN } from '../constants/common';
import { MESSAGES } from '../constants/messages';
import { STORE_KEYS } from '../constants/store';

class PluginManager {

  configureDialog = null;
  loginDialog = null;
  confirmFolderDialog = null;

  constructor() {
    Store.on(STORE_KEYS.loginInProcess, (eventData) => this.onChangeLoginInProgress(eventData));
  }

  // Commands ---------------------------------------------------------------------------------------------------------

  openSettings() {
    atom.workspace.open(`atom://config/packages/${PLUGIN.name}`);
  }

  toggleProblemsPanel() {
    atom.workspace.toggle(PLUGIN.problemsPanelURI);
  }

  // Data Flow --------------------------------------------------------------------------------------------------------

  openConfigureDialog() {

    const onClickCloud = () => {
      Store.set(STORE_KEYS.serviceURL, PLUGIN.url);
      HttpModule.init(PLUGIN.url);

      this.configureDialog.dismiss();
      this.openLoginDialog();
    }

    const onClickPremise = () => {
      this.openSettings();
      this.configureDialog.dismiss();
    }

    this.configureDialog = atom.notifications.addInfo(MESSAGES.configurePrompt, {
      dismissable: true,
      buttons: [
        {
          text: MESSAGES.configureCloud,
          onDidClick: onClickCloud,
        },
        {
          text: MESSAGES.configurePremise,
          onDidClick: onClickPremise,
        },
      ],
    });
  }

  openLoginDialog() {

    const onClickLogin = async () => {
      Store.set(STORE_KEYS.loginInProcess, true);
      this.loginDialog.dismiss();

      await AuthModule.login();
    }

    this.loginDialog = atom.notifications.addInfo(MESSAGES.loginPrompt, {
      dismissable: true,
      buttons: [
        {
          text: MESSAGES.loginOK,
          onDidClick: onClickLogin,
        },
      ],
    });
  }

  checkLogin() {
    setTimeout(async () => {
      const isLoginValid = await AuthModule.checkLogin();
      if (!isLoginValid) {
        this.openLoginDialog();
        return;
      }

      this.checkConfirmedFolders();
    }, 0);
  }

  checkConfirmedFolders() {
    const unconfirmedFolders = FileUtils.getUnconfirmedProjectFolders();
    if (unconfirmedFolders.length === 0) {
      console.log('All folders are confirmed to upload');
      this.setupWatchers();
      return;
    }

    const onClickConfirm = (folder) => {
      const confirmedFolders = Store.get(STORE_KEYS.confirmedFolders);
      confirmedFolders.push(folder);
      Store.set(STORE_KEYS.confirmedFolders, confirmedFolders);

      FileWatcher.addFolderToScan(folder);

      this.confirmFolderDialog.dismiss();
      this.checkConfirmedFolders();
    }

    const createConfirmDialog = (folder) => {
      const dialog = atom.notifications.addInfo(MESSAGES.confirmFolderPrompt(folder), {
        dismissable: true,
        buttons: [
          {
            text: MESSAGES.confirmFolderOK,
            onDidClick: () => onClickConfirm(folder),
          },
        ],
      });

      return dialog;
    }

    const folder = unconfirmedFolders[0];
    this.confirmFolderDialog = createConfirmDialog(folder);
  }

  setupWatchers() {
    setTimeout(async () => {
      await FileWatcher.activate();
    }, 0);
  }

  // Subscribes -------------------------------------------------------------------------------------------------------

  onChangeLoginInProgress(eventData) {
    console.log('onChangeLoginInProgress: ', eventData);
    const { newValue } = eventData;
    if (newValue !== false) {
      return;
    }

    const isLoggedIn = Store.flags.isLoggedIn();
    if (!isLoggedIn) {
      return;
    }

    this.checkConfirmedFolders();
  }

  // Utils ------------------------------------------------------------------------------------------------------------

  destroy() {
    this.configureDialog = null;
    this.loginDialog = null;
    this.confirmFolderDialog = null;

    FileWatcher.destroy();
  }
}

const PluginManagerInstance = new PluginManager();

export { PluginManagerInstance as PluginManager };
