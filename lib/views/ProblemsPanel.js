'use babel';

import { isArray } from 'lodash';

import { Store } from '../modules/Store';

import { PLUGIN } from '../constants/common';
import { STORE_KEYS } from '../constants/store';
import { SEVERITY_ICONS } from '../constants/analysis';

export class ProblemsPanel {

  element = null;
  tbody = null;
  // subscriptions = null;

  constructor() {
    this.element = document.createElement('div');
    this.element.classList.add('deepcode');

    const tableHead = this.renderTableHead();

    this.tbody = document.createElement('div');
    this.tbody.classList.add('dc-table');
    this.tbody.style = 'overflow-y: scroll; height: 100%';

    this.element.appendChild(tableHead);
    this.element.appendChild(this.tbody);

    this.renderTableRows();

    Store.on(STORE_KEYS.analysisResults, () => this.renderTableRows());

    // this.subscriptions = atom.workspace.getCenter().observeActivePaneItem((item) => {
    //   if (!atom.workspace.isTextEditor(item)) {
    //     message.innerText = 'Open a file to see important information about it.';
    //     return;
    //   }
    //   message.innerHTML = `
    //     <h2>${item.getFileName() || 'untitled'}</h2>
    //     <ul>
    //       <li><b>Soft Wrap:</b> ${item.softWrapped}</li>
    //       <li><b>Tab Length:</b> ${item.getTabLength()}</li>
    //       <li><b>Encoding:</b> ${item.getEncoding()}</li>
    //       <li><b>Line Count:</b> ${item.getLineCount()}</li>
    //     </ul>
    //   `;
    // });
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

    table.forEach(row => {
      const { severity, localName, localPath, message, position } = row;
      const icon = `<div class="icon ${SEVERITY_ICONS[severity]}"></div>`;
      const fileName = `
        <span class="name">${localName}</span>
        <span class="path">${localPath}</span>
      `;

      const tr = document.createElement('div');
      tr.classList.add('row');
      tr.innerHTML = `
        <div class="col severity">${icon}</div>
        <div class="col file">${fileName}</div>
        <div class="col message">${message}</div>
        <div class="col position">${position}</div>
      `;

      this.tbody.appendChild(tr);
    });
  }

  // Service ----------------------------------------------------------------------------------------------------------

  clearTableBody() {
    while (this.tbody.firstChild) {
      this.tbody.removeChild(this.tbody.firstChild);
    }
  }

  destroy() {
    this.element.remove();
    // this.subscriptions.dispose();
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
