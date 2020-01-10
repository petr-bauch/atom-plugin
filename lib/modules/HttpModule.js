'use babel';

import httpRequest from 'request-promise';

import { Logger } from './Logger';
import { PLUGIN } from '../constants/common';
import { API } from '../constants/api';

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

    return `${this.baseURL}/${url}`;
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
      return Promise.resolve({ error, statusCode });
    }
  }

  async createBundle(token, body) {
    try {
      return await this.post(API.createBundle, { token, body });

    } catch (error) {
      const { statusCode } = error;
      return Promise.resolve({ error, statusCode });
    }
  }

  async checkBundle(token, bundleID) {
    try {
      return await this.get(API.checkBundle(bundleID), { token });

    } catch (error) {
      const { statusCode } = error;
      return Promise.resolve({ error, statusCode });
    }
  }

  async extendBundle(token, bundleID, body) {
    try {
      return await this.put(API.extendBundle(bundleID), { token, body });

    } catch (error) {
      const { statusCode } = error;
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
      return Promise.resolve({ error, statusCode });
    }
  }

  async checkAnalysis(token, bundleID) {
    try {
      return await this.get(API.analysis(bundleID), {
        token,
      });

    } catch (error) {
      const { statusCode } = error;
      return Promise.resolve({ error, statusCode });
    }
  }
}

const HttpModuleInstance = new HttpModule();

export { HttpModuleInstance as HttpModule };
