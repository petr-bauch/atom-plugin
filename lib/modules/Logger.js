'use babel';

import { isArray } from 'lodash';
import { PLUGIN } from '../constants/common';

const format = (num) => (`0${num}`).slice(-2);
const getDate = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = format(now.getMonth() + 1);
  const day = format(now.getDay());

  const hour = format(now.getHours());
  const min = format(now.getMinutes());
  const sec = format(now.getSeconds());

  const date = `${year}-${month}-${day}`;
  const time = `${hour}:${min}:${sec}`;
  const fullDate = `${date} ${time}`;

  return {
    date,
    time,
    fullDate,
  };
};

class Logger {

  useLog = false;

  init() {
    this.useLog = atom.config.get(`${PLUGIN.name}.debugLog`);
  }

  log(...args) {
    if (!this.useLog) {
      return;
    }

    const { time } = getDate();

    // eslint-disable-next-line no-console
    console.log(`[DC] ${time} `, ...args);
  }

  dbError(err = {}) {
    let errors = localStorage.getItem('DeepCode:DB:Errors') || [];
    if (!isArray(errors)) {
      errors = [];
    }
    errors.unshift(`${new Date()}: ${err.message}`);
    localStorage.setItem('DeepCode:DB:Errors', JSON.stringify(errors.slice(0, 30)));
  }

  destroy() {
    this.useLog = false;
  }
}

const LoggerInstance = new Logger();

export { LoggerInstance as Logger };
