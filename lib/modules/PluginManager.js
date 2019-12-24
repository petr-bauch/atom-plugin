'use babel';

import open from 'open';

import { Store } from './Store';
import { HttpModule } from './HttpModule';
import { AuthModule } from './AuthModule';
import { FileUtils } from './FileUtils';

import { PLUGIN } from '../constants/common';
import { MESSAGES } from '../constants/messages';
import { STORE_KEYS } from '../constants/store';

class PluginManager {

  configureDialog = null;
  loginDialog = null;

  openSettings() {
    atom.workspace.open(`atom://config/packages/${PLUGIN.name}`);
  }

  toggleProblemsPanel() {
    atom.workspace.toggle(PLUGIN.problemsPanelURI);
  }

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
      return;
    }

    console.log({ unconfirmedFolders });
  }

  checkWatchers() {

  }
}

const PluginManagerInstance = new PluginManager();

export { PluginManagerInstance as PluginManager };
