'use babel';

import { Store } from '../modules/Store';
import { PluginManager } from '../modules/PluginManager';
import { PLUGIN } from '../constants/common';

export class StatusBarButton {

  constructor(statusBar) {
    this.element = document.createElement('div');
    this.element.innerText = PLUGIN.statusTitle;
    this.element.classList.add('inline-block', 'text')

    this.element.addEventListener('click', () => {
      this.onClick();
    })
  }

  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

  onClick() {
    // TODO: temporary
    Store.reset();
    PluginManager.openSettings();
  }
}
