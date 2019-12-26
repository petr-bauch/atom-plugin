'use babel';

import { DB } from './Database';
import { Store } from './Store';

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
      };
    }, 0);
  }
}
