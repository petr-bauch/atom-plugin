'use babel';

import { Store } from '../modules/Store';
import { STORE_KEYS } from '../constants/store';
import { ProgressBar } from './ProgressBar';

export class ScanningProgress {

  refs = {
    statusButton: null,
    scanningContainer: null,
    scanningInfo: null,
    progressBar: null,
  };

  tooltips = {
    scanning: null,
  };

  constructor(statusButton) {
    this.refs.statusButton = statusButton;
    Store.on(STORE_KEYS.scanningFolder, (eventData) => this.onChangeScanningFolder(eventData));

    this.refs.progressBar = new ProgressBar();
  }

  show() {
    if (this.tooltips.scanning) {
      return;
    }

    const item = this.render();
    this.tooltips.scanning = atom.tooltips.add(this.refs.statusButton, {
      item,
      placement: 'top',
      trigger: 'manual',
      class: 'dc-tooltip',
    });
  }

  hide() {
    if (this.tooltips.scanning) {
      this.tooltips.scanning.dispose();
    }
    this.refs.scanningContainer = null;
    this.refs.scanningInfo = null;
    this.tooltips.scanning = null;
  }

  render() {
    this.refs.scanningContainer = document.createElement('div');
    this.refs.scanningContainer.classList.add('dc-scanning-container');

    const icon = document.createElement('div');
    icon.classList.add('icon', 'icon-search');

    const infoContainer = document.createElement('div');
    infoContainer.classList.add('info-container');

    const title = document.createElement('div');
    title.classList.add('title');
    title.innerText = 'Scanning folders...';

    this.refs.scanningInfo = document.createElement('div');
    this.refs.scanningInfo.classList.add('info');
    this.refs.scanningInfo.innerText = '';

    const progressBar = this.refs.progressBar.getElement();

    infoContainer.appendChild(title);
    infoContainer.appendChild(this.refs.scanningInfo);
    infoContainer.appendChild(progressBar);

    this.refs.scanningContainer.appendChild(icon);
    this.refs.scanningContainer.appendChild(infoContainer);

    this.refs.progressBar.start();

    return this.refs.scanningContainer;
  }

  // Store Subscriptions ----------------------------------------------------------------------------------------------

  onChangeScanningFolder(eventData) {
    const { newValue } = eventData;
    if (!this.tooltips.scanning || !this.refs.scanningInfo) {
      return;
    }

    this.refs.scanningInfo.innerText = newValue;
  }
}
