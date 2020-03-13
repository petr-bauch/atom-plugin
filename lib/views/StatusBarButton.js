'use babel';

import { isNumber } from 'lodash';

import { Store } from '../modules/Store';
import { CommonUtils } from '../modules/CommonUtils';

import { PLUGIN } from '../constants/common';
import { STORE_KEYS } from '../constants/store';
import { SEVERITY, SEVERITY_ICONS, SEVERITY_CLASSES } from '../constants/analysis';

import { ScanningProgress } from './ScanningProgress';
import { UploadProgress } from './UploadProgress';
import { AnalyzingProgress } from './AnalyzingProgress';
import { ComposingProgress } from './ComposingProgress';
import { PluginManager } from '../modules/PluginManager';

export class StatusBarButton {

  refs = {
    statusButton: null,
    statusBarTile: null,
    scanningProgress: null,
    uploadProgress: null,
    analyzingProgress: null,
    composingProgress: null,
  };

  listeners = {
    statusButton: null,
  };

  init(statusBar) {
    const statusButton = this.createStatusButton();
    this.render();

    this.refs.statusBarTile = statusBar.addRightTile({
      item: statusButton,
      priority: 0,
    });

    this.refs.scanningProgress = new ScanningProgress(statusButton);
    this.refs.uploadProgress = new UploadProgress(statusButton);
    this.refs.analyzingProgress = new AnalyzingProgress(statusButton);
    this.refs.composingProgress = new ComposingProgress(statusButton);

    Store.on(STORE_KEYS.scanningInProcess, (eventData) => this.onChangeScanningInProgress(eventData));
    Store.on(STORE_KEYS.uploadInProgress, (eventData) => this.onChangeUploadInProgress(eventData));
    Store.on(STORE_KEYS.analysisInProgress, (eventData) => this.onChangeAnalysisInProgress(eventData));
    Store.on(STORE_KEYS.composingInProcess, (eventData) => this.onChangeComposingInProgress(eventData));
    Store.on(STORE_KEYS.analysisResults, () => this.onChangeAnalysisResults());
    Store.on(STORE_KEYS.analysisWasStarted, () => this.onChangeAnalysisResults());
  }

  // Renders ----------------------------------------------------------------------------------------------------------

  createStatusButton() {
    this.refs.statusButton = document.createElement('div');
    this.refs.statusButton.classList.add('inline-block', 'text', 'dc-status');

    this.listeners.statusButton = this.refs.statusButton.addEventListener('click', () => {
      this.onClickButton();
    });

    return this.refs.statusButton;
  }

  render() {
    const { count, title } = this.renderStatusInfo();

    this.refs.statusButton.innerHTML = `<span class="name">${PLUGIN.statusTitle}</span>${count}`;
    this.refs.statusButton.title = title;
  }

  renderStatusInfo() {
    const { info, warning, critical, total } = CommonUtils.getIndicators();
    if (total === 0) {
      const analyseIsCompleted = Store.get(STORE_KEYS.analyseIsCompleted);
      const analysisInProgress = Store.get(STORE_KEYS.analysisInProgress);
      if (analysisInProgress) {
        return {
          count: this.renderIndicator(),
          title: 'Deepcode is analyzing project...',
        };
      }

      if (!analyseIsCompleted) {
        const counts = [
          this.renderIndicator(SEVERITY.critical, '?'),
          this.renderIndicator(SEVERITY.warning, '?'),
        ];
        return {
          count: counts.join(''),
          title: 'Deepcode is inactive. Click here to activate it',
        };
      }

      return {
        count: this.renderIndicator(SEVERITY.ok),
        title: 'There are no problem with code',
      };
    }

    const counts = [];
    if (critical > 0) {
      const indicator = this.renderIndicator(SEVERITY.critical, critical);
      counts.push(indicator);
    }
    if (warning > 0) {
      const indicator = this.renderIndicator(SEVERITY.warning, warning);
      counts.push(indicator);
    }
    if (info > 0) {
      const indicator = this.renderIndicator(SEVERITY.info, info);
      counts.push(indicator);
    }

    return {
      count: counts.join(''),
      title: `Critical: ${critical}, Warning: ${warning}, Info: ${info}`,
    };
  }

  renderIndicator(severity = null, count = '?') {
    if (!isNumber(severity)) {
      return '<a class="count"><span class="icon icon-sync"></span></a>';
    }

    if (severity === SEVERITY.ok) {
      return `<a class="count ${SEVERITY_CLASSES[severity]}"><span class="icon ${SEVERITY_ICONS[severity]}"></span></a>`;
    }

    const srtCount = isNumber(count) ? this.stringifyCount(count) : count;
    return `<a class="count ${SEVERITY_CLASSES[severity]}"><span class="icon ${SEVERITY_ICONS[severity]}"></span>${srtCount}</a>`;
  }

  stringifyCount(count) {
    let stringCount = String(count);
    if (count >= 1000) {
      stringCount = `${Math.trunc(count / 1000)}K+`;
    }

    return stringCount;
  }

  // Callbacks --------------------------------------------------------------------------------------------------------

  onClickButton() {
    PluginManager.openProblemsPanel();
  }

  // Store Subscriptions ----------------------------------------------------------------------------------------------

  onChangeScanningInProgress(eventData) {
    const { newValue } = eventData;

    // show scanning progress
    if (newValue) {
      this.refs.scanningProgress.show();

    // hide scanning progress
    } else {
      this.refs.scanningProgress.hide();
    }
  }

  onChangeUploadInProgress(eventData) {
    const { newValue } = eventData;

    // show upload progress
    if (newValue) {
      this.refs.uploadProgress.show();

      // hide upload progress
    } else if (!newValue) {
      this.refs.uploadProgress.hide();
    }
  }

  onChangeAnalysisInProgress(eventData) {
    const { newValue } = eventData;

    // show analysis progress
    if (newValue) {
      this.refs.analyzingProgress.show();

      // hide analysis progress
    } else {
      this.refs.analyzingProgress.hide();
    }

    this.render();
  }

  onChangeComposingInProgress(eventData) {
    const { newValue } = eventData;

    if (newValue) {
      this.refs.composingProgress.show();
      return;
    }

    this.refs.composingProgress.hide();
  }

  onChangeAnalysisResults() {
    this.render();
  }

  // Utils ------------------------------------------------------------------------------------------------------------

  destroy() {
    this.refs.statusButton.remove();
    this.refs.statusButton = null;

    this.refs.statusBarTile.destroy();
    this.refs.statusBarTile = null;
  }

  getElement() {
    return this.refs.statusButton;
  }
}
