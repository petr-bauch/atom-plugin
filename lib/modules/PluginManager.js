'use babel';

import { Store } from './Store';
import { HttpModule } from './HttpModule';
import { AuthModule } from './AuthModule';
import { FileUtils } from './FileUtils';
import { CommonUtils } from './CommonUtils';
import { BundleModule } from './BundleModule';
import { Logger } from './Logger';

import { FileWatcher } from '../watchers/FileWatcher';

import { PLUGIN } from '../constants/common';
import { MESSAGES } from '../constants/messages';
import { CUSTOM_EVENTS, STORE_KEYS } from '../constants/store';
import { Analyser } from './Analyser';

class PluginManager {

  configureDialog = null;
  loginDialog = null;
  confirmFolderDialog = null;

  constructor() {
    Store.on(STORE_KEYS.loginInProcess, (eventData) => this.onChangeLoginInProgress(eventData));
    Store.on(CUSTOM_EVENTS.didLogout, () => this.didLogout());
  }

  // Commands ---------------------------------------------------------------------------------------------------------

  openSettings() {
    atom.workspace.open(`atom://config/packages/${PLUGIN.name}`);
  }

  openProblemsPanel() {
    atom.workspace.open(PLUGIN.problemsPanelURI);

    setTimeout(async () => {
      await Analyser.clearResults();

      const { changedFiles } = FileWatcher.getState();
      if (changedFiles.length > 0) {
        await BundleModule.startBundleLoop(true);
        return;
      }

      await Analyser.startAnalysisLoop();
    }, 0);
  }

  scanProject() {
    const confirmedFolders = Store.get(STORE_KEYS.confirmedFolders);
    if (confirmedFolders.length === 0) {
      // CommonUtils.showWarning(MESSAGES.scanProjectNoFolders);
      this.checkConfirmedFolders();
      return;
    }

    confirmedFolders.forEach(folder => {
      FileWatcher.addFolderToScan(folder);
    });

    setTimeout(async () => {
      Store.set(STORE_KEYS.bundleID, '');
      await Analyser.clearResults();
      await FileWatcher.scanFolders();

      await CommonUtils.sleep(100);
      await BundleModule.startBundleLoop(true);
    }, 0);
  }

  resetPlugin() {
    Store.reset();
    CommonUtils.saveProjectStore();

    atom.notifications.addSuccess(MESSAGES.resetSuccessful, {
      dismissable: true,
    });

    atom.config.set(`${PLUGIN.name}.sessionToken`, ' ');
  }

  // Data Flow (operations queue) -------------------------------------------------------------------------------------

  openConfigureDialog() {

    const onClickCloud = () => {
      Store.set(STORE_KEYS.serviceURL, PLUGIN.url);
      HttpModule.init(PLUGIN.url);

      this.configureDialog.dismiss();
      this.openLoginDialog();
    };

    const onClickPremise = () => {
      this.openSettings();
      this.configureDialog.dismiss();
    };

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
    if (this.loginDialog) {
      return;
    }

    const onClickLogin = async () => {
      if (this.loginDialog) {
        Store.set(STORE_KEYS.loginInProcess, true);

        this.loginDialog.dismiss();
        this.loginDialog = null;

        await AuthModule.login();
      }


    };

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

      this.checkFilters();
    }, 0);
  }

  checkFilters() {
    setTimeout(async () => {
      const sessionToken = Store.get(STORE_KEYS.sessionToken);
      const { error, extensions, configFiles } = await HttpModule.getFilters(sessionToken);
      if (error) {
        Logger.log('Getting filters failed: ', error);
        return;
      }

      Store.set(STORE_KEYS.allowedFiles, {
        extensions: extensions || [],
        configFiles: configFiles || [],
      });

      this.checkConfirmedFolders();
    }, 0);
  }

  checkConfirmedFolders() {
    const unconfirmedFolders = FileUtils.getUnconfirmedProjectFolders();
    if (unconfirmedFolders.length === 0) {
      Logger.log('All folders are confirmed to upload');
      this.startWatchers();
      return;
    }

    const onClickConfirm = (folder) => {
      const confirmedFolders = Store.get(STORE_KEYS.confirmedFolders);
      confirmedFolders.push(folder);
      Store.set(STORE_KEYS.confirmedFolders, confirmedFolders);

      FileWatcher.addFolderToScan(folder);

      this.confirmFolderDialog.dismiss();
      this.checkConfirmedFolders();
    };

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
    };

    const folder = unconfirmedFolders[0];
    this.confirmFolderDialog = createConfirmDialog(folder);
  }

  startWatchers() {
    setTimeout(async () => {
      await FileWatcher.activate();
      this.runStartupTasks();
    }, 0);
  }

  runStartupTasks() {
    setTimeout(async () => {
      const firstStart = Store.get(STORE_KEYS.firstStart);
      const reScanOnStart = CommonUtils.reScanOnStart();

      if (reScanOnStart) {
        await this.scanProject();

      } else {
        await CommonUtils.sleep(100);
        await BundleModule.startBundleLoop(firstStart);
        await Analyser.startAnalysisLoop();
      }

      if (firstStart) {
        // atom.workspace.open(PLUGIN.problemsPanelURI);
        Store.set(STORE_KEYS.firstStart, false);
      }
    }, 0);
  }

  // Subscribes -------------------------------------------------------------------------------------------------------

  onChangeLoginInProgress(eventData) {
    const { newValue } = eventData;
    if (newValue !== false) {
      return;
    }

    const isLoggedIn = Store.flags.isLoggedIn();
    if (!isLoggedIn) {
      return;
    }

    this.checkFilters();
  }

  didUpdateConfigAnalyseOnChange() {
    setTimeout(async () => {
      await BundleModule.restartBundleLoop();
    }, 0);
  }

  didLogout() {
    const loginInProcess = Store.get(STORE_KEYS.loginInProcess);
    if (loginInProcess) {
      return;
    }

    Store.setMany({
      [STORE_KEYS.accountType]: '',
      [STORE_KEYS.sessionToken]: '',
    });

    this.openLoginDialog();
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
