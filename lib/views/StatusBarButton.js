'use babel';

import { Store } from '../modules/Store';
import { PLUGIN } from '../constants/common';
import { STORE_KEYS } from '../constants/store';

import { StatusBarMenu } from './StatusBarMenu';
import { ScanningProgress } from './ScanningProgress';
import { UploadProgress } from './UploadProgress';
import { AnalyzingProgress } from './AnalyzingProgress';

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
  }

  // Renders ----------------------------------------------------------------------------------------------------------

  createStatusButton() {
    this.refs.statusButton = document.createElement('div');
    this.refs.statusButton.innerText = PLUGIN.statusTitle;
    this.refs.statusButton.classList.add('inline-block', 'text', 'dc-status');

    this.listeners.statusButton = this.refs.statusButton.addEventListener('click', () => {
      this.onClickButton();
    });

    return this.refs.statusButton;
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
