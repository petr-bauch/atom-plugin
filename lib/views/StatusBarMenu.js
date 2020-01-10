'use babel';

import { Store } from '../modules/Store';
import { PluginManager } from '../modules/PluginManager';
import { CommonUtils } from '../modules/CommonUtils';

import { MESSAGES, STATUS_BAR_MENU } from '../constants/messages';

export class StatusBarMenu {

  refs = {
    statusButton: null,

    menuContainer: null,
    panelItem: null,
    scanItem: null,
    settingsItem: null,
    resetItem: null,
  };

  listeners = {
    panel: null,
    scan: null,
    settings: null,
    reset: null,
  };

  tooltips = {
    menu: null,
  };

  cb = {
    onHide: null,
  };

  constructor(statusButton, onHide) {
    this.refs.statusButton = statusButton;
    this.cb.onHide = onHide;
  }

  show() {
    const menu = this.renderMenu();
    this.tooltips.menu = atom.tooltips.add(this.refs.statusButton, {
      item: menu,
      placement: 'top',
      trigger: 'manual',
      class: 'dc-tooltip',
    });
  }

  hide() {
    this.removeMenuListeners();

    this.tooltips.menu.dispose();
    this.tooltips.menu = null;

    if (this.cb.onHide) {
      this.cb.onHide();
    }
  }

  renderMenuItem(title) {
    const item = document.createElement('div');
    item.classList.add('dc-menu-item');
    item.innerText = title;

    return item;
  }

  renderMenu() {
    this.refs.menuContainer = document.createElement('div');
    this.refs.menuContainer.classList.add('dc-menu-container');

    this.refs.panelItem = this.renderMenuItem(STATUS_BAR_MENU.openPanel);
    this.refs.scanItem = this.renderMenuItem(STATUS_BAR_MENU.scan);
    this.refs.settingsItem = this.renderMenuItem(STATUS_BAR_MENU.settings);
    this.refs.resetItem = this.renderMenuItem(STATUS_BAR_MENU.reset);

    this.refs.menuContainer.appendChild(this.refs.panelItem);
    this.refs.menuContainer.appendChild(this.refs.scanItem);
    this.refs.menuContainer.appendChild(this.refs.settingsItem);
    this.refs.menuContainer.appendChild(this.refs.resetItem);

    this.listeners.panel = this.refs.panelItem.addEventListener('click', () => {
      this.onClickOpenPanel();
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

  // Callbacks --------------------------------------------------------------------------------------------------------

  onClickOpenPanel() {
    PluginManager.openProblemsPanel();
    this.hide();
  }

  onClickScan() {
    PluginManager.scanProject();
    this.hide();
  }

  onClickSettings() {
    PluginManager.openSettings();
    this.hide();
  }

  onClickReset() {

    Store.reset();
    CommonUtils.saveProjectStore();

    atom.notifications.addSuccess(MESSAGES.resetSuccessful, {
      dismissable: true,
    });

    this.hide();
  }

  // Utils ------------------------------------------------------------------------------------------------------------

  removeMenuListeners() {
    if (this.listeners.panel && this.refs.panelItem) {
      this.refs.panelItem.removeEventListener('click', this.listeners.panel);
    }
    if (this.listeners.scan && this.refs.scanItem) {
      this.refs.scanItem.removeEventListener('click', this.listeners.scan);
    }
    if (this.listeners.settings && this.refs.settingsItem) {
      this.refs.settingsItem.removeEventListener('click', this.listeners.settings);
    }
    if (this.listeners.reset && this.refs.resetItem) {
      this.refs.resetItem.removeEventListener('click', this.listeners.reset);
    }
  }
}
