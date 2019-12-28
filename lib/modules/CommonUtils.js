'use babel';

import { DB } from './Database';
import { Store } from './Store';
import { PLUGIN } from '../constants/common';

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
        console.log(err);
        const errors = localStorage.getItem('DeepCode:DB:Errors') || [];
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
}
