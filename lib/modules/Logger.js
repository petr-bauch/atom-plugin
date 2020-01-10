'use babel';

import { PLUGIN } from '../constants/common';

const format = (num) => (`0${num}`).slice(-2);
const getTime = () => {
  const date = new Date();
  const hour = format(date.getHours());
  const min = format(date.getMinutes());
  const sec = format(date.getSeconds());

  return `[DC] ${hour}:${min}:${sec}`;
};

export class Logger {

  static log(...args) {
    const isAllowed = atom.config.get(`${PLUGIN.name}.debugLog`);
    if (!isAllowed) {
      return;
    }

    const time = getTime();

    // eslint-disable-next-line no-console
    console.log(time, ...args);
  }
}
