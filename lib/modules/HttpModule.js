'use babel';

import request from 'request-promise';
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

    const response = await request({
      uri,
      method: 'GET',
      ...defaults,
      ...headers,
    });

    const { body, statusCode } = response;
    return { statusCode, ...body };
  }

  async post(url = '', options = {}) {
    const uri = this.makeURI(url);
    const { body = null, token = '', fileUpload = false } = options;
    const headers = this.makeHeaders('POST', { token, fileUpload });

    const { body: responseBody, statusCode } = await request({
      uri,
      method: 'POST',
      ...defaults,
      ...headers,
      ...(body && { body }),
    });

    return { statusCode, ...responseBody };
  }

  async put(url = '', options = {}) {
    const uri = this.makeURI(url);
    const { body = null, token = '' } = options;
    const headers = this.makeHeaders('PUT', { token });

    const { body: responseBody, statusCode } = await request({
      uri,
      method: 'PUT',
      ...defaults,
      ...headers,
      ...(body && { body }),
    });

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
      return Promise.resolve({ error });
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
}

const HttpModuleInstance = new HttpModule();

export { HttpModuleInstance as HttpModule };
