'use babel';

import { Store } from './Store';
import { DB } from './Database';
import { HttpModule } from './HttpModule';
import { AuthModule } from './AuthModule';
import { FileUtils } from './FileUtils';
import { CommonUtils } from './CommonUtils';
import { BundleModule } from './BundleModule';
import { Analyser } from './Analyser';
import { Logger } from './Logger';

import { FileWatcher } from '../watchers/FileWatcher';

import { PLUGIN } from '../constants/common';
import { MESSAGES } from '../constants/messages';
import { CUSTOM_EVENTS, STORE_KEYS } from '../constants/store';

class PluginManager {

  loginDialog = null;
  confirmFolderDialog = null;

  constructor() {
    Store.on(CUSTOM_EVENTS.didLogin, () => this.didLogin());
    Store.on(CUSTOM_EVENTS.didLogout, () => this.didLogout());
  }

  // Commands ---------------------------------------------------------------------------------------------------------

  openSettings() {
    atom.workspace.open(`atom://config/packages/${PLUGIN.name}`);
  }

  openProblemsPanel() {
    atom.workspace.open(PLUGIN.problemsPanelURI);

    const isLoggedIn = Store.flags.isLoggedIn();
    if (!isLoggedIn) {
      if (this.loginDialog) {
        this.loginDialog = null;
      }

      this.openLoginDialog();
      return;
    }

    setTimeout(async () => {
      const { changedFiles } = FileWatcher.getState();
      if (changedFiles.length > 0) {
        await BundleModule.startBundleLoop(true);
        return;
      }

      await Analyser.startAnalysisLoop();
    }, 0);
  }

  scanProject() {
    const isLoggedIn = Store.flags.isLoggedIn();
    if (!isLoggedIn) {
      if (this.loginDialog) {
        this.loginDialog = null;
      }

      this.openLoginDialog();
      return;
    }

    const confirmedFolders = Store.get(STORE_KEYS.confirmedFolders);
    if (confirmedFolders.length === 0) {
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
    CommonUtils.resetDB();

    atom.notifications.addSuccess(MESSAGES.resetSuccessful, {
      dismissable: true,
    });

    atom.config.set(`${PLUGIN.name}.sessionToken`, '');
  }

  // Data Flow (operations queue) -------------------------------------------------------------------------------------

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

  checkFilters(testCallback = null) {
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
      if (testCallback) {
        testCallback({ extensions, configFiles });
      }
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
      await this.scanProject();
    }, 0);
  }

  // Subscribes -------------------------------------------------------------------------------------------------------

  didLogin() {
    this.checkFilters();
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

  didUpdateConfigAnalyseOnChange() {
    setTimeout(async () => {
      await BundleModule.restartBundleLoop();
    }, 0);
  }

  didChangePaths(projectPaths) {
    setTimeout(async () => {
      await BundleModule.stopBundleLoop();

      FileUtils.init();
      FileUtils.initIgnore();

      FileWatcher.actualizeState();

      const sharedState = await DB.restoreState(true);
      const projectState = await DB.restoreState();

      let confirmedFolders = projectState[STORE_KEYS.confirmedFolders] || [];
      confirmedFolders = confirmedFolders.filter(folder => projectPaths.includes(folder));

      Store.init(sharedState, projectState);
      Store.set(STORE_KEYS.bundleID, '');
      Store.set(STORE_KEYS.confirmedFolders, confirmedFolders);

      CommonUtils.saveProjectStore();

      this.checkConfirmedFolders();
    }, 0);
  }

  // Testing API ------------------------------------------------------------------------------------------------------

  async scanConfirmedFolders() {
    const confirmedFolders = Store.get(STORE_KEYS.confirmedFolders);
    confirmedFolders.forEach(folder => {
      FileWatcher.addFolderToScan(folder);
    });

    await FileWatcher.scanFolders();
    return Promise.resolve();
  }

  async createBundle() {
    await this.scanConfirmedFolders();
    const bundle = await FileWatcher.buildBundle();

    return bundle;
  }

  async createRemoteBundle() {
    const sessionToken = Store.get(STORE_KEYS.sessionToken);

    await this.scanConfirmedFolders();
    await BundleModule.updateState();

    const { files } = await FileWatcher.buildBundle();
    const { bundleId } = await HttpModule.createBundle(sessionToken, { files });

    const chunks = await BundleModule.createUploadChunks(files);

    return { bundleId, chunks };
  }

  async checkAnalysis() {
    const { analysisResults } = await Analyser.checkAnalysis();
    const { origin, table } = await Analyser.adaptResults(analysisResults);

    return Promise.resolve({ origin, table });
  }

  // Utils ------------------------------------------------------------------------------------------------------------

  destroy() {
    this.loginDialog = null;
    this.confirmFolderDialog = null;

    FileWatcher.destroy();
  }
}

const PluginManagerInstance = new PluginManager();

export { PluginManagerInstance as PluginManager };
