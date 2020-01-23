'use babel';

/**
 * This adapter is supposed for adapting requests and responses when Atom is working on Windows.
 * The server with AI expects that file's path will be started with '/'
 * But on Windows the absolute path looks like 'C:\Project\main.js'
 * So, before request we add a slash and then after response we remove first slash
 * in order to not break down working with file system.
 */

import { keys } from 'lodash';

import { PLUGIN } from '../constants/common';
import { DIRECTION, TYPES } from '../constants/winAdapter';

class WinAdapter {

  addSlash(fileName) {
    return `/${fileName}`;
  }

  removeSlash(fileName) {
    return fileName.replace('/', '');
  }

  adapt(type, direction, body) {
    if (!PLUGIN.isWindows) {
      return body;
    }

    // Create bundle
    if (type === TYPES.createBundle && direction === DIRECTION.request) {
      return this.adaptRequestCreateBundle(body);
    }
    if (type === TYPES.createBundle && direction === DIRECTION.response) {
      return this.adaptResponseCreateBundle(body);
    }

    // Check Bundle
    if (type === TYPES.checkBundle && direction === DIRECTION.response) {
      return this.adaptResponseCheckBundle(body);
    }

    // Extend bundle
    if (type === TYPES.extendBundle && direction === DIRECTION.request) {
      return this.adaptRequestExtendBundle(body);
    }
    if (type === TYPES.extendBundle && direction === DIRECTION.response) {
      return this.adaptResponseExtendBundle(body);
    }

    return body;
  }

  adaptRequestCreateBundle(body) {
    const { files } = body;
    const resFiles = keys(files).reduce((res, key) => {
      const newKey = this.addSlash(key);
      res[newKey] = files[key];

      return res;
    }, {});

    return {
      ...body,
      files: resFiles,
    };
  }

  adaptResponseCreateBundle(body) {
    const { missingFiles } = body;
    const resMissingFiles = [...missingFiles].map(fileName => {
      return this.removeSlash(fileName);
    });

    return {
      ...body,
      missingFiles: resMissingFiles,
    };
  }

  adaptResponseCheckBundle(body) {
    // response must be the same as for 'Create Bundle'
    return this.adaptResponseCreateBundle(body);
  }

  adaptRequestExtendBundle(body) {
    const { files, removedFiles } = body;

    const resFiles = keys(files).reduce((res, key) => {
      const newKey = this.addSlash(key);
      res[newKey] = files[key];

      return res;
    }, {});

    const resRemovedFiles = [...removedFiles].map(fileName => {
      return this.addSlash(fileName);
    });

    return {
      ...body,
      files: resFiles,
      removedFiles: resRemovedFiles,
    };
  }

  adaptResponseExtendBundle(body) {
    // response must be the same as for 'Create Bundle'
    return this.adaptResponseCreateBundle(body);
  }
}

const WinAdapterInstance = new WinAdapter();

export { WinAdapterInstance as WinAdapter };
