'use babel';

import { Store } from '../modules/Store';
import { STORE_KEYS } from '../constants/store';
import { MESSAGES } from '../constants/messages';

import { ProgressBar } from './ProgressBar';

export class AnalyzingProgress {

  refs = {
    statusButton: null,
    progressContainer: null,
    progressInfo: null,
    progressBar: null,
  };

  tooltips = {
    progress: null,
  };

  constructor(statusButton) {
    this.refs.statusButton = statusButton;
    Store.on(STORE_KEYS.analysisCompleted, (eventData) => this.onChangeAnalysisCompleted(eventData));

    this.refs.progressBar = new ProgressBar();
  }

  show() {
    if (this.tooltips.progress) {
      return;
    }

    const item = this.render();
    this.tooltips.progress = atom.tooltips.add(this.refs.statusButton, {
      item,
      placement: 'top',
      trigger: 'manual',
      class: 'dc-tooltip',
    });
  }

  hide() {
    if (this.tooltips.progress) {
      this.tooltips.progress.dispose();
    }
    this.refs.progressContainer = null;
    this.refs.progressInfo = null;
    this.tooltips.progress = null;
  }

  render() {
    this.refs.progressContainer = document.createElement('div');
    this.refs.progressContainer.classList.add('dc-analysis-container');

    const icon = document.createElement('div');
    icon.classList.add('icon', 'icon-eye');

    const infoContainer = document.createElement('div');
    infoContainer.classList.add('info-container');

    const title = document.createElement('div');
    title.classList.add('title');
    title.innerText = MESSAGES.analysisProgressTitle;

    this.refs.progressInfo = document.createElement('div');
    this.refs.progressInfo.classList.add('info');
    this.refs.progressInfo.innerText = MESSAGES.analysisProgressInfo(0);

    const progressBar = this.refs.progressBar.getElement();

    infoContainer.appendChild(title);
    infoContainer.appendChild(this.refs.progressInfo);
    infoContainer.appendChild(progressBar);

    this.refs.progressContainer.appendChild(icon);
    this.refs.progressContainer.appendChild(infoContainer);

    this.updateProgress(0);

    return this.refs.progressContainer;
  }

  updateProgress(progress) {
    this.refs.progressBar.update(progress, 100);
  }

  // Store Subscriptions ----------------------------------------------------------------------------------------------

  onChangeAnalysisCompleted(eventData) {
    const { newValue } = eventData;
    if (!this.tooltips.progress || !this.refs.progressInfo) {
      return;
    }

    this.updateProgress(newValue);
    this.refs.progressInfo.innerText = MESSAGES.analysisProgressInfo(newValue);
  }
}
