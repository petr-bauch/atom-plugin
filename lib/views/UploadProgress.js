'use babel';

import { Store } from '../modules/Store';
import { STORE_KEYS } from '../constants/store';
import { MESSAGES } from '../constants/messages';

import { ProgressBar } from './ProgressBar';

export class UploadProgress {

  refs = {
    statusButton: null,
    uploadContainer: null,
    uploadInfo: null,
    progressBar: null,
  };

  tooltips = {
    upload: null,
  };

  progressValues = [];

  constructor(statusButton) {
    this.refs.statusButton = statusButton;
    Store.on(STORE_KEYS.uploadCompleted, (eventData) => this.onChangeUploadCompleted(eventData));

    this.refs.progressBar = new ProgressBar();
  }

  show() {
    if (this.tooltips.upload) {
      return;
    }

    const item = this.render();
    this.tooltips.upload = atom.tooltips.add(this.refs.statusButton, {
      item,
      placement: 'top',
      trigger: 'manual',
      class: 'dc-tooltip',
    });
  }

  hide() {
    if (this.tooltips.upload) {
      this.tooltips.upload.dispose();
    }
    this.refs.uploadContainer = null;
    this.refs.uploadInfo = null;
    this.tooltips.upload = null;
  }

  render() {
    this.refs.uploadContainer = document.createElement('div');
    this.refs.uploadContainer.classList.add('dc-upload-container');

    const icon = document.createElement('div');
    icon.classList.add('icon', 'icon-cloud-upload');

    const infoContainer = document.createElement('div');
    infoContainer.classList.add('info-container');

    const title = document.createElement('div');
    title.classList.add('title');
    title.innerText = MESSAGES.uploadProgressTitle;

    this.refs.uploadInfo = document.createElement('div');
    this.refs.uploadInfo.classList.add('info');
    this.refs.uploadInfo.innerText = '';

    const progressBar = this.refs.progressBar.getElement();

    infoContainer.appendChild(title);
    infoContainer.appendChild(this.refs.uploadInfo);
    infoContainer.appendChild(progressBar);

    this.refs.uploadContainer.appendChild(icon);
    this.refs.uploadContainer.appendChild(infoContainer);

    this.updateProgress(0);

    return this.refs.uploadContainer;
  }

  updateProgress(progress) {
    const total = Store.get(STORE_KEYS.uploadTotal);
    this.refs.progressBar.update(progress, total);
  }

  // Store Subscriptions ----------------------------------------------------------------------------------------------

  onChangeUploadCompleted(eventData) {
    const { newValue } = eventData;
    if (!this.tooltips.upload || !this.refs.uploadInfo) {
      return;
    }

    this.updateProgress(newValue);
    const total = Store.get(STORE_KEYS.uploadTotal);

    this.progressValues.push(newValue);
    const maxValue = Math.max(...this.progressValues);

    this.refs.uploadInfo.innerText = MESSAGES.uploadProgressInfo(maxValue, total);
  }
}
