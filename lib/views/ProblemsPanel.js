'use babel';

import { isArray, toInteger } from 'lodash';

import { Store } from '../modules/Store';
import { EditorUtils } from '../modules/EditorUtils';

import { PLUGIN } from '../constants/common';
import { STORE_KEYS } from '../constants/store';
import { SEVERITY_ICONS, SEVERITY_CLASSES } from '../constants/analysis';

export class ProblemsPanel {

  element = null;
  tbody = null;
  subscriptions = null;

  constructor() {
    this.element = document.createElement('div');
    this.element.classList.add('dc-panel');

    const tableHead = this.renderTableHead();

    this.tbody = document.createElement('div');
    this.tbody.classList.add('dc-table');
    this.tbody.style = 'overflow-y: scroll; height: 100%';

    this.element.appendChild(tableHead);
    this.element.appendChild(this.tbody);

    this.renderTableRows();

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
    tableHead.innerHTML = `
        <div class="row">
          <div class="col severity"></div>
          <div class="col file">File name</div>
          <div class="col message">Description</div>
          <div class="col position">Position</div>
        </div>
    `;

    return tableHead;
  }

  renderTableRows() {
    const { table } = Store.get(STORE_KEYS.analysisResults);
    this.clearTableBody();
    if (!isArray(table)) {
      return;
    }

    table.forEach((row, index) => {
      const { severity, localName, localPath, message, position, markers } = row;
      const icon = `<div class="icon ${SEVERITY_ICONS[severity]} ${SEVERITY_CLASSES[severity]}"></div>`;

      const markersRows = markers.map(marker => {
        const { startRow, startCol } = marker;
        const dataAttrs = `data-row="${startRow}" data-col="${startCol}"`;
        return `
          <div class="info-row" ${dataAttrs}>
            <span class="info-row-pos" ${dataAttrs}>${localName} [${startRow}, ${startCol}]:</span>
            <span class="info-row-hint" ${dataAttrs}>Issue helper</span>
          </div>
        `;
      }).join('');

      const fileName = `
        <div class="file-box">
          <div class="file-box-row">
            <span class="name">${localName}</span>
            <span class="path">${localPath}</span>
          </div>
          <div class="file-box-info">
            ${markersRows}
          </div>
        </div>
      `;

      const tr = document.createElement('div');
      tr.id = `dcRow-${index}`;
      tr.classList.add('row');
      tr.innerHTML = `
        <div class="col severity">${icon}</div>
        <div class="col file">${fileName}</div>
        <div class="col message">${message}</div>
        <div class="col position">${position}</div>
      `;
      tr.onclick = this.onRowClick;

      this.tbody.appendChild(tr);
    });
  }

  // Events -----------------------------------------------------------------------------------------------------------

  onRowClick(event) {
    const { target, currentTarget } = event;

    const rowID = currentTarget.id;
    const rowIndex = String(rowID).split('-')[1];
    if (!rowIndex) {
      return;
    }

    const { table } = Store.get(STORE_KEYS.analysisResults);
    const row = table[rowIndex];
    if (!row) {
      return;
    }

    const { fileName } = row;
    const isInfoRow = target.className.includes('info-row');
    const startRow = isInfoRow ? toInteger(target.dataset.row) : row.startRow;
    const startCol = isInfoRow ? toInteger(target.dataset.col) : row.startCol;

    setTimeout(async () => {
      await EditorUtils.openFile(fileName, startRow, startCol);
      await EditorUtils.createMarkers();
    }, 0);

    // expand current line, fold others
    if (!isInfoRow) {
      const tableBody = document.querySelector('.dc-table');
      const children = tableBody.childNodes;
      for (let i = 0; i < children.length; i++) {
        const rowNode = children[i];
        if (rowNode.id === rowID) {
          rowNode.classList.add('row-active');
        } else {
          rowNode.classList.remove('row-active');
        }
      }
    }
  }

  onResultsChange() {
    this.renderTableRows();
    setTimeout(async () => {
      await EditorUtils.createMarkersForAllEditors();
    }, 0);
  }

  // Service ----------------------------------------------------------------------------------------------------------

  clearTableBody() {
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
