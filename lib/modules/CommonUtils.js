'use babel';

import { groupBy, keys, values, find } from 'lodash';

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

  static resetDB() {
    setTimeout(async () => {
      try {
        await DB.clearDB();

      } catch (err) {
        Logger.log(err);
        Logger.dbError(err);
      }
    }, 0);
  }

  static saveSharedStore() {
    const sharedState = Store.getSharedState();

    setTimeout(async () => {
      try {
        await DB.storeState(sharedState, true);

      } catch (err) {
        Logger.log(err);
        Logger.dbError(err);
      }
    }, 0);
  }

  static saveProjectStore() {
    const projectState = Store.getProjectState();

    setTimeout(async () => {
      try {
        await DB.storeState(projectState);

      } catch (err) {
        Logger.log(err);
        Logger.dbError(err);
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
    const defaultValue = {
      info: 0,
      warning: 0,
      critical: 0,
      total: 0,
      files: 0,
    };

    const { origin } = Store.get(STORE_KEYS.analysisResults);
    if (!origin) {
      return defaultValue;
    }

    const { files, suggestions } = origin;
    if (!files || !suggestions) {
      return defaultValue;
    }

    const filesCount = keys(files).length;
    const suggestionsList = values(suggestions);
    const messagesGroups = groupBy(suggestionsList, suggestion => suggestion.id);

    let info = 0;
    let warning = 0;
    let critical = 0;

    keys(messagesGroups).forEach(id => {
      const suggestion = find(suggestionsList, { id });
      if (!suggestion) {
        return;
      }

      const { severity } = suggestion;

      info += (severity === SEVERITY.info) ? 1 : 0;
      warning += (severity === SEVERITY.warning) ? 1 : 0;
      critical += (severity === SEVERITY.critical) ? 1 : 0;
    });

    const total = info + warning + critical;

    return {
      info,
      warning,
      critical,
      total,
      files: filesCount,
    };
  }

  static deriveSuggestionID(id = '') {
    const parts = decodeURIComponent(id).split('/').reverse();
    if (parts.length === 1) {
      return parts[0];
    }

    return parts[0] !== 'test' ? parts[0] : parts[1];
  }
}
