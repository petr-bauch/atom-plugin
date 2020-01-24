'use babel';

import fs from 'fs';
import os from 'os';
import { isArray, isEmpty } from 'lodash';
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
  useFile = false;
  fileName = '';
  fsStream = null;

  init() {
    this.useLog = atom.config.get(`${PLUGIN.name}.debugLog`);
    this.resetFileConfig();

    if (!this.useLog) {
      return;
    }

    const projectPaths = atom.project.getPaths();
    if (!isArray(projectPaths) || isEmpty(projectPaths)) {
      return;
    }

    const debugLogFile = atom.config.get(`${PLUGIN.name}.debugLogFile`);
    if (!debugLogFile) {
      return;
    }

    this.useFile = true;
    this.fileName = `${projectPaths[0]}${PLUGIN.pathSeparator}deepcode.log`;
    this.fsStream = fs.createWriteStream(this.fileName, {
      flags: 'w',
    });
  }

  resetFileConfig() {
    this.useFile = false;
    this.fileName = '';

    this.closeFileStream();
  }

  closeFileStream() {
    if (this.fsStream) {
      this.fsStream.end();
      // this.fsStream.destroy();
      this.fsStream = null;
    }
  }

  critical(...args) {
    if (!this.useLog) {
      return;
    }

    this.log(...args);

    if (this.useFile) {
      this.logFile(...args);
    }
  }

  log(...args) {
    if (!this.useLog) {
      return;
    }

    const { time } = getDate();

    // eslint-disable-next-line no-console
    console.log(`[DC] ${time}`, ...args);
  }

  logFile(...args) {
    if (!this.fsStream) {
      return;
    }

    const { fullDate } = getDate();

    const messages = args.map(arg => {
      let res = '';
      try {
        res = JSON.stringify(arg);
      } catch (e) {
        // nothing
      }

      return res;
    });

    try {
      this.fsStream.write(`${fullDate} ${messages.join('')}`);
      this.fsStream.write(os.EOL);
    } catch (e) {
      // nothing
    }
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
    this.resetFileConfig();
  }
}

const LoggerInstance = new Logger();

export { LoggerInstance as Logger };
