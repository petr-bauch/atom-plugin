'use babel';

import { Emitter } from 'atom';
import { isArray, capitalize } from 'lodash';

import { Store } from '../modules/Store';
import { EditorUtils } from '../modules/EditorUtils';
import { CommonUtils } from '../modules/CommonUtils';
import { ProblemsRow } from './ProblemsRow';

import { PLUGIN } from '../constants/common';
import { STORE_KEYS } from '../constants/store';
import { PluginManager } from '../modules/PluginManager';

export class ProblemsPanel {

  element = null;
  panelTitle = null;
  analysisURL = null;
  tbody = null;
  subscriptions = null;

  emitter = new Emitter();
  problemRows = new Map();

  state = {
    activeRowID: '',
    expandedFileRows: [],
    expandedDescRows: [],
  };

  constructor() {

    this.onClickRow = this.onClickRow.bind(this);

    this.element = document.createElement('div');
    this.element.classList.add('dc-panel');

    const tableHead = this.renderTableHead();

    this.tbody = document.createElement('div');
    this.tbody.classList.add('dc-table');
    this.tbody.style = 'overflow-y: scroll; height: 100%';

    this.element.appendChild(tableHead);
    this.element.appendChild(this.tbody);

    this.renderTableTree();

    Store.on(STORE_KEYS.analysisResults, () => this.onResultsChange());

    this.subscriptions = atom.workspace.getCenter().observeActivePaneItem(item => {
      if (!atom.workspace.isTextEditor(item)) {
        return;
      }
      setTimeout(async () => {
        await EditorUtils.createMarkers();
      }, 0);
    });
  }

  // Renders ----------------------------------------------------------------------------------------------------------

  renderTableHead() {
    const tableHead = document.createElement('div');
    tableHead.classList.add('dc-table-head');

      const left = document.createElement('div');
      left.classList.add('left');

        const panelTitle = document.createElement('span');
        panelTitle.classList.add('title');
        panelTitle.innerText = '';

        const analysisURL = document.createElement('a');
        analysisURL.classList.add('analysis-url');
        analysisURL.innerText = '';

      left.appendChild(panelTitle);
      left.appendChild(analysisURL);

      const right = document.createElement('div');
      right.classList.add('right');

        const pluginButtons = document.createElement('div');
        pluginButtons.classList.add('plugin-buttons');

          const btnScan = document.createElement('div');
          btnScan.classList.add('pm-btn');
          btnScan.innerHTML = `
            <span class="icon icon-eye"></span>
            <span>Scan project</span>
          `;
          btnScan.title = 'Re-scan all folders of the project';
          btnScan.onclick = () => PluginManager.scanProject();

          const btnSettings = document.createElement('div');
          btnSettings.classList.add('pm-btn');
          btnSettings.innerHTML = `
            <span class="icon icon-gear"></span>
            <span>Settings</span>
          `;
          btnSettings.title = 'Open plugin settings';
          btnSettings.onclick = () => PluginManager.openSettings();

        pluginButtons.appendChild(btnScan);
        pluginButtons.appendChild(btnSettings);

        const treeSettings = document.createElement('div');
        treeSettings.classList.add('tree-settings');

          const treeSettingsIcon = document.createElement('div');
          treeSettingsIcon.classList.add('icon', 'icon-list-unordered');

          const treeSettingsTitle = document.createElement('div');
          treeSettingsTitle.classList.add('title');
          treeSettingsTitle.innerText = 'Results:';

          const linkExpand = document.createElement('a');
          linkExpand.classList.add('expand');
          linkExpand.innerText = 'Expand';
          linkExpand.onclick = () => this.onClickExpandAll();

          const linkCollapse = document.createElement('a');
          linkCollapse.classList.add('collapse');
          linkCollapse.innerText = 'Collapse';
          linkCollapse.onclick = () => this.onClickCollapseAll();

        treeSettings.appendChild(treeSettingsIcon);
        treeSettings.appendChild(treeSettingsTitle);
        treeSettings.appendChild(linkExpand);
        treeSettings.appendChild(linkCollapse);

      right.appendChild(pluginButtons);
      right.appendChild(treeSettings);

    tableHead.appendChild(left);
    tableHead.appendChild(right);

    this.panelTitle = panelTitle;
    this.analysisURL = analysisURL;

    this.updatePanelTitle();

    return tableHead;
  }

  renderTableTree() {
    const { activeRowID, expandedFileRows, expandedDescRows } = this.state;

    this.emitter.clear();
    this.clearTableTree();

    const { table } = Store.get(STORE_KEYS.analysisResults);
    if (!isArray(table)) {
      return;
    }

    table.forEach(fileRow => {
      const { rowID, fileName, descriptions, localName, localPath } = fileRow;
      const problemRow = new ProblemsRow(rowID, fileName, this.emitter);

      this.problemRows.set(fileName, problemRow);

      problemRow.update({
        name: localName,
        path: localPath,
        descriptions,
        fileRow,

        active: (rowID === activeRowID),
        expanded: (expandedFileRows.includes(rowID)),
        expandedDescRows: expandedDescRows.filter(id => id.includes(`row-description-${fileName}`)),
        onClick: this.onClickRow,
      });

      const rowElement = problemRow.getElement();
      this.tbody.appendChild(rowElement);
    });
  }

  // Events -----------------------------------------------------------------------------------------------------------

  onClickRow(eventData) {
    const { type, rowID } = eventData;
    switch (type) {
      case 'row-description': {
        this.onClickRowDescription(rowID, eventData);
        break;
      }
      case 'row-marker': {
        this.onClickRowMarker(rowID, eventData);
        break;
      }
      default: {
        this.onClickRowFile(rowID);
      }
    }
  }

  onClickRowFile(rowID) {
    const { expandedFileRows } = this.state;

    this.state.activeRowID = rowID;
    if (expandedFileRows.includes(rowID)) {
      this.state.expandedFileRows = expandedFileRows.filter(id => id !== rowID);
    } else {
      this.state.expandedFileRows = [...expandedFileRows, rowID];
    }

    this.emitter.emit('panelState', this.state);
  }

  onClickRowDescription(rowID, eventData) {
    const { fileName, startRow, startCol } = eventData;
    const { expandedDescRows } = this.state;

    this.state.activeRowID = rowID;
    if (expandedDescRows.includes(rowID)) {
      this.state.expandedDescRows = expandedDescRows.filter(id => id !== rowID);

    } else {
      this.state.expandedDescRows = [...expandedDescRows, rowID];
      setTimeout(async () => {
        await EditorUtils.openFile(fileName, startRow, startCol);
        await EditorUtils.createMarkers();
      }, 0);
    }

    this.emitter.emit('panelState', this.state);
  }

  onClickRowMarker(rowID, eventData) {
    const { fileName, startRow, startCol, markerID } = eventData;

    this.state.activeRowID = rowID;
    setTimeout(async () => {
      await EditorUtils.openFile(fileName, startRow, startCol, markerID);
      await EditorUtils.createMarkers();
    }, 0);

    this.emitter.emit('panelState', this.state);
  }

  onResultsChange() {
    this.updatePanelTitle();
    this.updateAnalysisURL();
    this.renderTableTree();

    setTimeout(async () => {
      await EditorUtils.createMarkersForAllEditors();
    }, 0);
  }

  onClickCollapseAll() {
    this.state.activeRowID = '';
    this.state.expandedDescRows = [];
    this.state.expandedFileRows = [];

    this.emitter.emit('panelState', this.state);
  }

  onClickExpandAll() {
    this.state.activeRowID = '';
    this.state.expandedDescRows = [];
    this.state.expandedFileRows = [];

    this.problemRows.forEach(problemRow => {
      this.state.expandedFileRows.push(problemRow.rowID);
    });

    this.emitter.emit('panelState', this.state);
  }

  // Service ----------------------------------------------------------------------------------------------------------

  updatePanelTitle() {
    this.panelTitle.innerText = this.createPanelTitle();
  }

  updateAnalysisURL() {
    const url = Store.get(STORE_KEYS.analysisURL);
    if (!url) {
      this.analysisURL.innerText = '';
      this.analysisURL.href = '';
      return;
    }

    this.analysisURL.innerText = 'View results online';
    this.analysisURL.href = url;
  }

  createPanelTitle() {

    const noProblem = 'There are no problems with code';
    const processing = 'Please wait, processing data...';
    const inactive = 'Deepcode is inactive. Login and scan project to activate it';

    const isScanning = Store.get(STORE_KEYS.scanningInProcess);
    const isComposing = Store.get(STORE_KEYS.composingInProcess);
    const isUpload = Store.get(STORE_KEYS.uploadInProgress);
    const isAnalysis = Store.get(STORE_KEYS.analysisInProgress);
    const analyseIsCompleted = Store.get(STORE_KEYS.analyseIsCompleted);

    if (isComposing || isUpload || isAnalysis || isScanning) {
      return processing;
    }

    if (!analyseIsCompleted) {
      return inactive;
    }

    const { info, warning, critical, total, files } = CommonUtils.getIndicators();
    if (analyseIsCompleted) {
      if (!total) {
        return noProblem;
      }
    }

    const details = [];
    if (critical > 0) { details.push(`critical: ${critical}`); }
    if (warning > 0) { details.push(`warning: ${warning}`); }
    if (info > 0) { details.push(`info: ${info}`); }

    const strDetails = details.join(', ');

    return `Found problems: ${total} in ${files} file(s).    ${capitalize(strDetails)}`;
  }

  clearTableTree() {
    this.problemRows = new Map();
    while (this.tbody.firstChild) {
      this.tbody.removeChild(this.tbody.firstChild);
    }
  }

  destroy() {
    this.element.remove();
    this.subscriptions.dispose();
  }

  getElement() {
    return this.element;
  }

  getTitle() {
    return PLUGIN.title;
  }

  getURI() {
    return PLUGIN.problemsPanelURI;
  }

  getDefaultLocation() {
    return 'bottom';
  }

  getAllowedLocations() {
    return ['left', 'right', 'bottom'];
  }
}
