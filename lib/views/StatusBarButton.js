'use babel';

import { Store } from '../modules/Store';
import { PLUGIN } from '../constants/common';
import { STORE_KEYS } from '../constants/store';

import { StatusBarMenu } from './StatusBarMenu';
import { ScanningProgress } from './ScanningProgress';
import { UploadProgress } from './UploadProgress';
import { AnalyzingProgress } from './AnalyzingProgress';
import { SEVERITY, SEVERITY_ICONS, SEVERITY_CLASSES } from '../constants/analysis';

export class StatusBarButton {

  refs = {
    statusButton: null,
    statusBarTile: null,
    statusBarMenu: null,
    scanningProgress: null,
    uploadProgress: null,
    analyzingProgress: null,
  };

  listeners = {
    statusButton: null,
  };

  state = {
    isMenuOpened: false,
  };

  init(statusBar) {
    const statusButton = this.createStatusButton();
    this.render();

    this.refs.statusBarTile = statusBar.addRightTile({
      item: statusButton,
      priority: 0,
    });

    this.refs.statusBarMenu = new StatusBarMenu(statusButton, () => this.onHideMenu());
    this.refs.scanningProgress = new ScanningProgress(statusButton);
    this.refs.uploadProgress = new UploadProgress(statusButton);
    this.refs.analyzingProgress = new AnalyzingProgress(statusButton);

    Store.on(STORE_KEYS.scanningInProcess, (eventData) => this.onChangeScanningInProgress(eventData));
    Store.on(STORE_KEYS.uploadInProgress, (eventData) => this.onChangeUploadInProgress(eventData));
    Store.on(STORE_KEYS.analysisInProgress, (eventData) => this.onChangeAnalysisInProgress(eventData));
    Store.on(STORE_KEYS.analysisResults, () => this.onChangeAnalysisResults());
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
    const { table } = Store.get(STORE_KEYS.analysisResults);

    const infoCount = table.filter(row => row.severity === SEVERITY.info).length;
    const warningCount = table.filter(row => row.severity === SEVERITY.warning).length;
    const criticalCount = table.filter(row => row.severity === SEVERITY.critical).length;

    const totalCount = infoCount + warningCount + criticalCount;

    const count = this.renderCount(totalCount, criticalCount, warningCount, infoCount);
    const name = (totalCount > 0) ? `${PLUGIN.statusTitle}: ` : PLUGIN.statusTitle;
    const title = (totalCount > 0)
      ? `Critical: ${criticalCount}, Warning: ${warningCount}, Info: ${infoCount}`
      : 'There are no problem with code';

    this.refs.statusButton.innerHTML = `<span class="name">${name}</span>${count}`;
    this.refs.statusButton.title = title;
  }

  renderCount(totalCount, criticalCount, warningCount, infoCount) {
    if (totalCount === 0) {
      return '';
    }

    const counts = [];
    if (criticalCount > 0) {
      const severity = SEVERITY.critical;
      const count = this.stringifyCount(criticalCount);
      counts.push(`<a class="count ${SEVERITY_CLASSES[severity]}"><span class="icon ${SEVERITY_ICONS[severity]}"></span>${count}</a>`);
    }
    if (warningCount > 0) {
      const severity = SEVERITY.warning;
      const count = this.stringifyCount(warningCount);
      counts.push(`<a class="count ${SEVERITY_CLASSES[severity]}"><span class="icon ${SEVERITY_ICONS[severity]}"></span>${count}</a>`);
    }
    if (infoCount > 0) {
      const severity = SEVERITY.info;
      const count = this.stringifyCount(infoCount);
      counts.push(`<a class="count ${SEVERITY_CLASSES[severity]}"><span class="icon ${SEVERITY_ICONS[severity]}"></span>${count}</a>`);
    }

    return counts.join('');
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
    if (this.state.isMenuOpened) {
      this.refs.statusBarMenu.hide();
      this.state.isMenuOpened = false;

    } else {
      this.refs.statusBarMenu.show();
      this.state.isMenuOpened = true;
    }
  }

  onHideMenu() {
    this.state.isMenuOpened = false;
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
    } else if (!newValue) {
      this.refs.analyzingProgress.hide();
    }
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
