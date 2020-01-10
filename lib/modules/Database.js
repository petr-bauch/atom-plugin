'use babel';

/* eslint-disable no-shadow,prefer-promise-reject-errors */

import { FileUtils } from './FileUtils';
import { Logger } from './Logger';
import { PLUGIN } from '../constants/common';

const tName = 'projects';

class Database {

  db = null;

  constructor() {
    const openRequest = indexedDB.open(PLUGIN.dbName, PLUGIN.dbVersion);
    openRequest.onsuccess = () => {
      this.db = openRequest.result;
      Logger.log('DB is ready');
    };
    openRequest.onerror = () => {
      this.db = null;
      Logger.log('DB error: ', openRequest.error);
    };
    openRequest.onupgradeneeded = () => {
      const db = openRequest.result;
      if (!db.objectStoreNames.contains(tName)) {
        db.createObjectStore(tName);
      }

      this.db = db;
      Logger.log(`DB is upgraded to version ${PLUGIN.dbVersion}`);
    };
  }

  async init() {
    const timeout = new Promise(resolve => {
      setTimeout(() => {
        resolve(false);
      }, 5000);
    });
    const connect = new Promise(resolve => {
      const interval = setInterval(() => {
        if (this.db) {
          clearInterval(interval);
          resolve(true);
        }
      }, 100);
    });

    const result = await Promise.race([timeout, connect]).then(result => result);

    return Promise.resolve(result);
  }

  async storeState(state) {
    if (!this.db) {
      return Promise.reject('DB is not running');
    }

    const path = FileUtils.getMainProjectPath();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(tName, 'readwrite');
      const store = transaction.objectStore(tName);
      const request = store.put(state, path);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async restoreState() {
    if (!this.db) {
      return Promise.reject('DB is not running');
    }

    const path = FileUtils.getMainProjectPath();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(tName);
      const store = transaction.objectStore(tName);
      const request = store.get(path);

      request.onsuccess = () => {
        resolve(request.result || {});
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }
}

const DB = new Database();

export { DB };
