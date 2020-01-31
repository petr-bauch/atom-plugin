'use babel';

import httpRequest from 'request-promise';

import { Store } from './Store';
import { Logger } from './Logger';
import { PLUGIN } from '../constants/common';
import { API } from '../constants/api';
import { CUSTOM_EVENTS } from '../constants/store';
import { WinAdapter } from './WinAdapter';
import { DIRECTION, TYPES } from '../constants/winAdapter';

const defaults = {
  resolveWithFullResponse: true,
  json: true,
};

class HttpModule {

  baseURL = PLUGIN.url;

  init(baseURL) {
    this.baseURL = baseURL;
  }

  makeURI(url = '', options = {}) {
    const { useAbsoluteURL } = options;
    if (useAbsoluteURL) {
      return url;
    }

    if (!url) {
      return this.baseURL;
    }

    return `${this.baseURL}${url}`;
  }

  makeHeaders(options) {
    const { method, token, fileUpload } = options;
    const headers = {};

    if (token) {
      headers['Session-Token'] = token;
    }

    if (method === 'POST' || method === 'PUT') {
      headers['Content-Type'] = 'application/json';
      if (fileUpload) {
        headers['Content-Type'] = 'application/json;charset=utf-8';
      }
    }

    return {
      headers,
    };
  }

  checkUnauthorized(statusCode) {
    if ([401, 403].includes(statusCode)) {
      Store.emit(CUSTOM_EVENTS.didLogout);
    }
  }

  async query(url = '', options = {}) {
    const method = options.method || 'GET';
    const uri = this.makeURI(url, options);
    const { body = null } = options;
    const headers = this.makeHeaders(options);

    const request = {
      uri,
      method,
      ...defaults,
      ...headers,
      ...(body && { body }),
    };

    Logger.log(`HTTP ${method} ${uri}:`);
    Logger.log('=> Request: ', request);

    const response = await httpRequest(request);
    const { body: responseBody, statusCode } = response;

    Logger.log('<= Response: ', response);

    return { statusCode, ...responseBody };
  }

  async get(url = '', options = {}) {
    return this.query(url, {
      method: 'GET',
      ...options,
    });
  }

  async post(url = '', options = {}) {
    return this.query(url, {
      method: 'POST',
      ...options,
    });
  }

  async put(url = '', options = {}) {
    return this.query(url, {
      method: 'PUT',
      ...options,
    });
  }

  async login() {
    try {
      return await this.post(API.login, {
        body: {
          source: PLUGIN.ideName,
        },
      });

    } catch (error) {
      const { statusCode } = error;
      return Promise.resolve({ error, statusCode });
    }
  }

  async checkSession(token) {
    try {
      return await this.get(API.session, {
        token,
      });

    } catch (error) {
      const { statusCode } = error;
      this.checkUnauthorized(statusCode);
      if (statusCode === 304) {
        return Promise.resolve({ statusCode });
      }

      return Promise.resolve({ error, statusCode });
    }
  }

  async getFilters(token) {
    try {
      return await this.get(API.filters, {
        token,
      });

    } catch (error) {
      const { statusCode } = error;
      this.checkUnauthorized(statusCode);

      return Promise.resolve({ error, statusCode });
    }
  }

  async createBundle(token, body) {
    try {
      const result = await this.post(API.createBundle, {
        token,
        body: WinAdapter.adapt(TYPES.createBundle, DIRECTION.request, body),
      });

      return WinAdapter.adapt(TYPES.createBundle, DIRECTION.response, result);

    } catch (error) {
      const { statusCode } = error;
      this.checkUnauthorized(statusCode);

      return Promise.resolve({ error, statusCode });
    }
  }

  async checkBundle(token, bundleID) {
    try {
      const result = await this.get(API.checkBundle(bundleID), { token });
      return WinAdapter.adapt(TYPES.checkBundle, DIRECTION.response, result);

    } catch (error) {
      const { statusCode } = error;
      this.checkUnauthorized(statusCode);

      return Promise.resolve({ error, statusCode });
    }
  }

  async extendBundle(token, bundleID, body) {
    try {
      const result = await this.put(API.extendBundle(bundleID), {
        token,
        body: WinAdapter.adapt(TYPES.extendBundle, DIRECTION.request, body),
      });

      return WinAdapter.adapt(TYPES.extendBundle, DIRECTION.response, result);

    } catch (error) {
      const { statusCode } = error;
      this.checkUnauthorized(statusCode);

      return Promise.resolve({ error, statusCode });
    }
  }

  async uploadFiles(token, uploadURL, body) {
    try {
      return await this.post(uploadURL, {
        token,
        body,
        fileUpload: true,
        useAbsoluteURL: true,
      });

    } catch (error) {
      const { statusCode } = error;
      this.checkUnauthorized(statusCode);

      return Promise.resolve({ error, statusCode });
    }
  }

  async checkAnalysis(token, bundleID) {
    try {
      const result = await this.get(API.analysis(bundleID), {
        token,
      });

      return WinAdapter.adapt(TYPES.checkAnalysis, DIRECTION.response, result);

    } catch (error) {
      const { statusCode } = error;
      this.checkUnauthorized(statusCode);

      return Promise.resolve({ error, statusCode });
    }
  }
}

const HttpModuleInstance = new HttpModule();

export { HttpModuleInstance as HttpModule };
