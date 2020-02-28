'use babel';

import { ServiceAI } from '@deepcode/tsc';

import { Store } from './Store';
import { WinAdapter } from './WinAdapter';

import { PLUGIN } from '../constants/common';
import { CUSTOM_EVENTS } from '../constants/store';
import { DIRECTION, TYPES } from '../constants/winAdapter';

const AI = new ServiceAI();
AI.init({
  baseURL: PLUGIN.url,
  useDebug: false,
});

class HttpModule {

  init({ baseURL, useDebug }) {
    AI.init({
      baseURL,
      useDebug,
    });
  }

  checkUnauthorized(statusCode) {
    if ([401, 403].includes(statusCode)) {
      Store.emit(CUSTOM_EVENTS.didLogout);
    }
  }

  getServiceAI() {
    return AI;
  }

  async login() {
    try {
      const result = await AI.startSession({ source: PLUGIN.ideName });
      return Promise.resolve(result);

    } catch (error) {
      return Promise.resolve({ error });
    }
  }

  async checkSession(sessionToken) {
    try {
      const result = await AI.checkSession({ sessionToken });
      return Promise.resolve(result);

    } catch (error) {
      const { statusCode } = error;
      this.checkUnauthorized(statusCode);

      return Promise.resolve({ error });
    }
  }

  async getFilters(sessionToken) {
    try {
      const result = await AI.getFilters({ sessionToken });
      return Promise.resolve(result);

    } catch (error) {
      const { statusCode } = error;
      this.checkUnauthorized(statusCode);

      return Promise.resolve({ error });
    }
  }

  async createBundle(sessionToken, body) {
    try {
      const adaptedBody = WinAdapter.adapt(TYPES.createBundle, DIRECTION.request, body);
      const result = await AI.createBundle({
        sessionToken,
        files: adaptedBody.files,
      });

      return WinAdapter.adapt(TYPES.createBundle, DIRECTION.response, result);

    } catch (error) {
      const { statusCode } = error;
      this.checkUnauthorized(statusCode);

      return Promise.resolve({ error, statusCode });
    }
  }

  async checkBundle(sessionToken, bundleId) {
    try {
      const result = await AI.checkBundle({
        sessionToken,
        bundleId,
      });

      return WinAdapter.adapt(TYPES.checkBundle, DIRECTION.response, result);

    } catch (error) {
      const { statusCode } = error;
      this.checkUnauthorized(statusCode);

      return Promise.resolve({ error, statusCode });
    }
  }

  async extendBundle(sessionToken, bundleId, body) {
    try {
      const adaptedBody = WinAdapter.adapt(TYPES.extendBundle, DIRECTION.request, body);
      const result = await AI.extendBundle({
        sessionToken,
        bundleId,
        files: adaptedBody.files,
        removedFiles: adaptedBody.removedFiles,
      });

      return WinAdapter.adapt(TYPES.extendBundle, DIRECTION.response, result);

    } catch (error) {
      const { statusCode } = error;
      this.checkUnauthorized(statusCode);

      return Promise.resolve({ error, statusCode });
    }
  }

  async uploadFiles(sessionToken, bundleId, body) {
    try {
      const result = await AI.uploadFiles({
        sessionToken,
        bundleId,
        content: body,
      });

      return Promise.resolve(result);

    } catch (error) {
      const { statusCode } = error;
      this.checkUnauthorized(statusCode);

      return Promise.resolve({ error, statusCode });
    }
  }

  async checkAnalysis(sessionToken, bundleId) {
    try {
      const result = AI.getAnalysis({
        sessionToken,
        bundleId,
      });

      return WinAdapter.adapt(TYPES.checkAnalysis, DIRECTION.response, result);

    } catch (error) {
      const { statusCode } = error;
      this.checkUnauthorized(statusCode);

      return Promise.resolve({ error, statusCode });
    }
  }

  async analyse(files, sessionToken) {
    try {
      return AI.analyse(files, sessionToken);

    } catch (error) {
      const { statusCode } = error;

      return Promise.resolve({ error, statusCode });
    }
  }
}

const HttpModuleInstance = new HttpModule();

export { HttpModuleInstance as HttpModule };
