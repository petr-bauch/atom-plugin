'use babel';

import httpRequest from 'request-promise';
import { PLUGIN } from '../constants/common';
import { API } from '../constants/api';

const defaults = {
  resolveWithFullResponse: true,
  json: true,
}

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

  makeHeaders(method, options) {
    const { token, fileUpload } = options;
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

  async get(url = '', options = {}) {
    const uri = this.makeURI(url);
    const headers = this.makeHeaders('GET', options);

    const request = {
      uri,
      method: 'GET',
      ...defaults,
      ...headers,
    };

    console.log(`HTTP GET ${uri}:`);
    console.log('Request: ', request);

    const response = await httpRequest(request);
    const { body, statusCode } = response;

    console.log('Response: ', response);

    return { statusCode, ...body };
  }

  async post(url = '', options = {}) {
    const uri = this.makeURI(url, options);
    const { body = null, token = '', fileUpload = false } = options;
    const headers = this.makeHeaders('POST', { token, fileUpload });

    const request = {
      uri,
      method: 'POST',
      ...defaults,
      ...headers,
      ...(body && { body }),
    }

    console.log(`HTTP POST ${uri}:`);
    console.log('Request: ', request);

    const response = await httpRequest(request);
    const { body: responseBody, statusCode } = response;

    console.log('Response: ', response);

    return { statusCode, ...responseBody };
  }

  async put(url = '', options = {}) {
    const uri = this.makeURI(url);
    const { body = null, token = '' } = options;
    const headers = this.makeHeaders('PUT', { token });

    const request = {
      uri,
      method: 'PUT',
      ...defaults,
      ...headers,
      ...(body && { body }),
    }

    console.log(`HTTP PUT ${uri}:`);
    console.log('Request: ', request);

    const response = await httpRequest(request);
    const { body: responseBody, statusCode } = response;

    console.log('Response: ', response);

    return { statusCode, ...responseBody };
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
      };

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
}

const HttpModuleInstance = new HttpModule();

export { HttpModuleInstance as HttpModule };
