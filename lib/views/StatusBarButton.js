'use babel';

import { Store } from '../modules/Store';
import { PluginManager } from '../modules/PluginManager';
import { DB } from '../modules/Database';
import { PLUGIN } from '../constants/common';
import { MESSAGES } from '../constants/messages';
import { STORE_KEYS } from '../constants/store';
import { CommonUtils } from '../modules/CommonUtils';

export class StatusBarButton {

  refs = {
    statusButton: null,
    statusBarTile: null,

    menuContainer: null,
    analysisItem: null,
    scanItem: null,
    settingsItem: null,
    resetItem: null,

    scanningContainer: null,
    scanningInfo: null,
  };

  listeners = {
    statusButton: null,
    analysis: null,
    scan: null,
    settings: null,
    reset: null,
  };

  tooltips = {
    menu: null,
    scanning: null,
  }

  constructor() {
    Store.on(STORE_KEYS.scanningInProcess, (eventData) => this.onChangeScanningInProgress(eventData));
    Store.on(STORE_KEYS.scanningFolder, (eventData) => this.onChangeScanningFolder(eventData));
  }

  init(statusBar) {
    const statusButton = this.createStatusButton();
    this.refs.statusBarTile = statusBar.addRightTile({
      item: statusButton,
      priority: 0,
    });
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

  renderMenu() {
    this.refs.menuContainer = document.createElement('div');
    this.refs.menuContainer.classList.add('dc-menu-container');

    this.refs.analysisItem = document.createElement('div');
    this.refs.analysisItem.classList.add('dc-menu-item');
    this.refs.analysisItem.innerText = 'Analyze code';

    this.refs.scanItem = document.createElement('div');
    this.refs.scanItem.classList.add('dc-menu-item');
    this.refs.scanItem.innerText = 'Scan project';

    this.refs.settingsItem = document.createElement('div');
    this.refs.settingsItem.classList.add('dc-menu-item');
    this.refs.settingsItem.innerText = 'Settings';

    this.refs.resetItem = document.createElement('div');
    this.refs.resetItem.classList.add('dc-menu-item');
    this.refs.resetItem.innerText = 'Reset plugin';

    this.refs.menuContainer.appendChild(this.refs.analysisItem);
    this.refs.menuContainer.appendChild(this.refs.scanItem);
    this.refs.menuContainer.appendChild(this.refs.settingsItem);
    this.refs.menuContainer.appendChild(this.refs.resetItem);

    this.listeners.analysis = this.refs.analysisItem.addEventListener('click', () => {
      this.onClickAnalyze();
    });

    this.listeners.scan = this.refs.scanItem.addEventListener('click', () => {
      this.onClickScan();
    });

    this.listeners.settingsListener = this.refs.settingsItem.addEventListener('click', () => {
      this.onClickSettings();
    });

    this.listeners.resetListener = this.refs.resetItem.addEventListener('click', () => {
      this.onClickReset();
    });

    return this.refs.menuContainer;
  }

  renderScanningProgress() {
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

    infoContainer.appendChild(title);
    infoContainer.appendChild(this.refs.scanningInfo);

    this.refs.scanningContainer.appendChild(icon);
    this.refs.scanningContainer.appendChild(infoContainer);

    return this.refs.scanningContainer;
  }

  // Callbacks --------------------------------------------------------------------------------------------------------

  onClickButton() {
    const menu = this.renderMenu();
    this.tooltips.menu = atom.tooltips.add(this.refs.statusButton, {
      item: menu,
      placement: 'top',
      trigger: 'manual',
      class: 'dc-tooltip',
    });
  }

  onClickAnalyze() {
    PluginManager.toggleProblemsPanel();
    this.hideMenu();
  }

  onClickScan() {
    PluginManager.scanProject();
    this.hideMenu();
  }

  onClickSettings() {
    PluginManager.openSettings();
    this.hideMenu();
  }

  onClickReset() {

    Store.reset();
    CommonUtils.saveProjectStore();

    atom.notifications.addSuccess(MESSAGES.resetSuccessful, {
      dismissable: true,
    });

    this.hideMenu();
  }

  // Store Subscriptions ----------------------------------------------------------------------------------------------

  onChangeScanningInProgress(eventData) {
    const { newValue } = eventData;

    // show scanning progress
    if (newValue && !this.tooltips.scanning) {
      const item = this.renderScanningProgress();
      this.tooltips.scanning = atom.tooltips.add(this.refs.statusButton, {
        item,
        placement: 'top',
        trigger: 'manual',
        class: 'dc-tooltip',
      });

    // hide scanning progress
    } else if (!newValue) {
      if (this.tooltips.scanning) {
        this.tooltips.scanning.dispose();
      };
      this.refs.scanningContainer = null;
      this.refs.scanningInfo = null;
      this.tooltips.scanning = null;
    }
  }

  onChangeScanningFolder(eventData) {
    const { newValue } = eventData;
    if (!this.tooltips.scanning || !this.refs.scanningInfo) {
      return;
    }

    this.refs.scanningInfo.innerText = newValue;
  }

  // Utils ------------------------------------------------------------------------------------------------------------

  destroy() {
    this.removeMenuListeners();

    this.refs.statusButton.remove();
    this.refs.statusButton = null;

    this.refs.statusBarTile.destroy()
    this.refs.statusBarTile = null;
  }

  getElement() {
    return this.refs.statusButton;
  }

  removeMenuListeners() {
    if (this.listeners.analysis) {
      this.refs.analysisItem.removeEventListener('click', this.listeners.analysis);
    }
    if (this.listeners.scan) {
      this.refs.scanItem.removeEventListener('click', this.listeners.scan);
    }
    if (this.listeners.settings) {
      this.refs.settingsItem.removeEventListener('click', this.listeners.settings);
    }
    if (this.listeners.reset) {
      this.refs.resetItem.removeEventListener('click', this.listeners.reset);
    }
  }

  hideMenu() {
    this.removeMenuListeners();
    this.refs.analysisItem.remove();
    this.refs.scanItem.remove();
    this.refs.settingsItem.remove();
    this.refs.resetItem.remove();

    this.refs.analysisItem = null;
    this.refs.scanItem = null;
    this.refs.settingsItem = null;
    this.refs.resetItem = null;

    this.tooltips.menu.dispose();
    this.tooltips.menu = null;
  }
}
