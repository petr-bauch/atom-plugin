'use babel';

import { groupBy, isArray, keys } from 'lodash';

import { DB } from './Database';
import { Store } from './Store';
import { Logger } from './Logger';
import { PLUGIN } from '../constants/common';
import { STORE_KEYS } from '../constants/store';
import { SEVERITY } from '../constants/analysis';

export class CommonUtils {
  static async sleep(timeout) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), timeout);
    });
  }

  static saveProjectStore() {
    const projectState = Store.getProjectState();

    setTimeout(async () => {
      try {
        await DB.storeState(projectState);
      } catch (err) {
        Logger.log(err);
        let errors = localStorage.getItem('DeepCode:DB:Errors') || [];
        if (!isArray(errors)) {
          errors = [];
        }
        errors.unshift(`${new Date()}: ${err.message}`);
        localStorage.setItem('DeepCode:DB:Errors', JSON.stringify(errors.slice(0, 10)));
      }
    }, 0);
  }

  // Notifications ----------------------------------------------------------------------------------------------------

  static showError(message, dismissable = false) {
    atom.notifications.addError(message, { dismissable });
  }

  static showWarning(message, dismissable = false) {
    atom.notifications.addWarning(message, { dismissable });
  }

  // Configs ----------------------------------------------------------------------------------------------------------

  static analyseOnChange() {
    return atom.config.get(`${PLUGIN.name}.analyseOnChange`);
  }

  static analyseOnChangeDelay() {
    return atom.config.get(`${PLUGIN.name}.analyseOnChangeDelay`);
  }

  static reScanOnStart() {
    return atom.config.get(`${PLUGIN.name}.reScanOnStart`);
  }

  // Clones some of configs into Store on activating stage:
  // it will allow to compare values if user has changed them
  // and make testing easier (no need to change real plugin configs)
  static clonePluginConfig() {
    const serviceURL = atom.config.get(`${PLUGIN.name}.serviceURL`);
    const sessionToken = atom.config.get(`${PLUGIN.name}.sessionToken`);

    Store.setMany({
      [STORE_KEYS.serviceURL]: serviceURL,
      [STORE_KEYS.sessionToken]: sessionToken,
    });
  }

  // Others -----------------------------------------------------------------------------------------------------------

  static getIndicators() {
    const { table } = Store.get(STORE_KEYS.analysisResults);
    if (!isArray(table)) {
      return {
        info: 0,
        warning: 0,
        critical: 0,
        total: 0,
        files: 0,
      };
    }

    const info = table.filter(row => row.severity === SEVERITY.info).length;
    const warning = table.filter(row => row.severity === SEVERITY.warning).length;
    const critical = table.filter(row => row.severity === SEVERITY.critical).length;

    const total = info + warning + critical;
    const fileGroups = groupBy(table, (row) => row.fileName);
    const files = keys(fileGroups).length;

    return {
      info,
      warning,
      critical,
      total,
      files,
    };
  }
}
