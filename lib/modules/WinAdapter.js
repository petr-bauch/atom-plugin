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

    // Check Analysis
    if (type === TYPES.checkAnalysis && direction === DIRECTION.response) {
      return this.adaptResponseCheckAnalysis(body);
    }

    return body;
  }

  adaptRequestCreateBundle(body) {
    const { files } = body;
    return {
      ...body,
      files: this.adaptObjectWithKeys(files, this.addSlash),
    };
  }

  adaptResponseCreateBundle(body) {
    const { missingFiles } = body;
    return {
      ...body,
      missingFiles: this.adaptStringArray(missingFiles, this.removeSlash),
    };
  }

  adaptResponseCheckBundle(body) {
    // response must be the same as for 'Create Bundle'
    return this.adaptResponseCreateBundle(body);
  }

  adaptRequestExtendBundle(body) {
    const { files, removedFiles } = body;
    return {
      ...body,
      files: this.adaptObjectWithKeys(files, this.addSlash),
      removedFiles: this.adaptStringArray(removedFiles, this.addSlash),
    };
  }

  adaptResponseExtendBundle(body) {
    // response must be the same as for 'Create Bundle'
    return this.adaptResponseCreateBundle(body);
  }

  adaptResponseCheckAnalysis(body) {
    const { analysisResults } = body;
    if (!analysisResults) {
      return body;
    }
    const { files } = analysisResults;

    return {
      ...body,
      analysisResults: {
        ...analysisResults,
        files: this.adaptObjectWithKeys(files, this.removeSlash),
      },
    };
  }

  adaptObjectWithKeys(object = {}, adapter) {
    const result = keys(object).reduce((res, key) => {
      const newKey = adapter(key);
      res[newKey] = object[key];

      return res;
    }, {});

    return result;
  }

  adaptStringArray(array = [], adapter) {
    const result = [...array].map(fileName => {
      return adapter(fileName);
    });

    return result;
  }
}

const WinAdapterInstance = new WinAdapter();

export { WinAdapterInstance as WinAdapter };
