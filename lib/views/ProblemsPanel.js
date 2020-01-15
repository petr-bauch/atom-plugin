'use babel';

import { Emitter } from 'atom';
import { isArray, groupBy, entries, capitalize } from 'lodash';

import { Store } from '../modules/Store';
import { EditorUtils } from '../modules/EditorUtils';
import { CommonUtils } from '../modules/CommonUtils';
import { ProblemsRow } from './ProblemsRow';

import { PLUGIN } from '../constants/common';
import { STORE_KEYS } from '../constants/store';

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

        const linkExpand = document.createElement('a');
        linkExpand.classList.add('expand');
        linkExpand.innerText = 'Expand';
        linkExpand.onclick = () => this.onClickExpandAll();

        const linkCollapse = document.createElement('a');
        linkCollapse.classList.add('collapse');
        linkCollapse.innerText = 'Collapse';
        linkCollapse.onclick = () => this.onClickCollapseAll();

      right.appendChild(linkExpand);
      right.appendChild(linkCollapse);

    tableHead.appendChild(left);
    tableHead.appendChild(right);

    this.panelTitle = panelTitle;
    this.analysisURL = analysisURL;

    this.updatePanelTitle();

    return tableHead;
  }

  renderTableTree() {

    this.emitter.clear();
    this.clearTableTree();

    const { table } = Store.get(STORE_KEYS.analysisResults);
    if (!isArray(table)) {
      return;
    }

    const fileGroups = groupBy(table, (row) => row.fileName);

    entries(fileGroups).forEach(group => {
      const [path, descriptions] = group;
      const problemRow = new ProblemsRow(path, this.emitter);
      this.problemRows.set(path, problemRow);

      problemRow.update({
        active: false,
        expanded: false,
        descriptions,
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
    const { fileName, startRow, startCol } = eventData;

    this.state.activeRowID = rowID;
    setTimeout(async () => {
      await EditorUtils.openFile(fileName, startRow, startCol);
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

    const isScanning = Store.get(STORE_KEYS.scanningInProcess);
    const isUpload = Store.get(STORE_KEYS.uploadInProgress);
    const isAnalysis = Store.get(STORE_KEYS.analysisInProgress);
    if (isScanning || isUpload || isAnalysis) {
      return processing;
    }

    const { info, warning, critical, total, files } = CommonUtils.getIndicators();
    if (!total) {
      return noProblem;
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
