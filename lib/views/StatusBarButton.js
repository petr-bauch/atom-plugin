'use babel';

import { Store } from '../modules/Store';
import { PluginManager } from '../modules/PluginManager';
import { DB } from '../modules/Database';
import { PLUGIN } from '../constants/common';
import { MESSAGES } from '../constants/messages';
import { STORE_KEYS } from '../constants/store';
import { CommonUtils } from '../modules/CommonUtils';

export class StatusBarButton {

  statusBarTile = null;
  statusButton = null;

  menuContainer = null;
  analysisItem = null;
  settingsItem = null;
  resetItem = null;

  scanningContainer = null;
  scanningInfo = null;

  buttonListener = null;
  analysisListener = null;
  settingsListener = null;
  resetListener = null;

  menuTooltip = null;
  scanningTooltip = null;

  constructor() {
    Store.on(STORE_KEYS.scanningInProcess, (eventData) => this.onChangeScanningInProgress(eventData));
    Store.on(STORE_KEYS.scanningFolder, (eventData) => this.onChangeScanningFolder(eventData));
  }

  init(statusBar) {
    this.statusButton = this.createStatusButton();
    this.statusBarTile = statusBar.addRightTile({
      item: this.statusButton,
      priority: 0,
    });
  }

  // Renders ----------------------------------------------------------------------------------------------------------

  createStatusButton() {
    const statusButton = document.createElement('div');
    statusButton.innerText = PLUGIN.statusTitle;
    statusButton.classList.add('inline-block', 'text', 'dc-status');

    this.buttonListener = statusButton.addEventListener('click', () => {
      this.onClickButton();
    });

    return statusButton;
  }

  renderMenu() {
    this.menuContainer = document.createElement('div');
    this.menuContainer.classList.add('dc-menu-container');

    this.analysisItem = document.createElement('div');
    this.analysisItem.classList.add('dc-menu-item');
    this.analysisItem.innerText = 'Analyze code';

    this.settingsItem = document.createElement('div');
    this.settingsItem.classList.add('dc-menu-item');
    this.settingsItem.innerText = 'Settings';

    this.resetItem = document.createElement('div');
    this.resetItem.classList.add('dc-menu-item');
    this.resetItem.innerText = 'Reset plugin';

    this.menuContainer.appendChild(this.analysisItem);
    this.menuContainer.appendChild(this.settingsItem);
    this.menuContainer.appendChild(this.resetItem);

    this.analysisListener = this.analysisItem.addEventListener('click', () => {
      this.onClickAnalyze();
    });

    this.settingsListener = this.settingsItem.addEventListener('click', () => {
      this.onClickSettings();
    });

    this.resetListener = this.resetItem.addEventListener('click', () => {
      this.onClickReset();
    });

    return this.menuContainer;
  }

  renderScanningProgress() {
    this.scanningContainer = document.createElement('div');
    this.scanningContainer.classList.add('dc-scanning-container');

    const icon = document.createElement('div');
    icon.classList.add('icon', 'icon-search');

    const infoContainer = document.createElement('div');
    infoContainer.classList.add('info-container');

    const title = document.createElement('div');
    title.classList.add('title');
    title.innerText = 'Scanning folders...';

    this.scanningInfo = document.createElement('div');
    this.scanningInfo.classList.add('info');
    this.scanningInfo.innerText = '/lib/modules';

    infoContainer.appendChild(title);
    infoContainer.appendChild(this.scanningInfo);

    this.scanningContainer.appendChild(icon);
    this.scanningContainer.appendChild(infoContainer);

    return this.scanningContainer;
  }

  // Callbacks --------------------------------------------------------------------------------------------------------

  onClickButton() {
    const menu = this.renderMenu();
    this.menuTooltip = atom.tooltips.add(this.statusButton, {
      item: menu,
      placement: 'top',
      trigger: 'click',
      class: 'dc-tooltip',
    });
  }

  onClickAnalyze() {
    PluginManager.toggleProblemsPanel();
  }

  onClickSettings() {
    PluginManager.openSettings();
  }

  onClickReset() {
    Store.reset();

    CommonUtils.saveProjectStore();

    atom.notifications.addSuccess(MESSAGES.resetSuccessful, {
      dismissable: true,
    });
  }

  onChangeScanningInProgress(eventData) {
    const { newValue } = eventData;

    // show scanning progress
    if (newValue && !this.scanningTooltip) {
      const item = this.renderScanningProgress();
      this.scanningTooltip = atom.tooltips.add(this.statusButton, {
        item,
        placement: 'top',
        trigger: 'manual',
        class: 'dc-tooltip',
      });

    // hide scanning progress
    } else if (!newValue) {
      if (this.scanningTooltip) {
        this.scanningTooltip.dispose();
      };
      this.scanningContainer = null;
      this.scanningInfo = null;
      this.scanningTooltip = null;
    }
  }

  onChangeScanningFolder(eventData) {
    const { newValue } = eventData;
    if (!this.scanningInfo) {
      return;
    }

    this.scanningInfo.innerText = newValue;
  }

  // Utils ------------------------------------------------------------------------------------------------------------

  destroy() {
    this.removeMenuListeners();

    this.statusButton.remove();
    this.statusButton = null;

    this.statusBarTile.destroy()
    this.statusBarTile = null;
  }

  getElement() {
    return this.statusButton;
  }

  removeMenuListeners() {
    if (this.analysisItem) { this.analysisItem.removeEventListener('click', this.analysisListener); }
    if (this.resetItem) { this.resetItem.removeEventListener('click', this.resetListener); }
    if (this.settingsItem) { this.settingsItem.removeEventListener('click', this.settingsListener); }
  }
}
