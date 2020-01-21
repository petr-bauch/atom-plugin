'use babel';

import { keys, isEqual } from 'lodash';
import { Logger } from '../modules/Logger';

import { SEVERITY_ICONS, SEVERITY_CLASSES } from '../constants/analysis';

const icons = {
  expanded: '<div class="icon icon-chevron-down"></div>',
  collapsed: '<div class="icon icon-chevron-right"></div>',
};

export class ProblemsRow {

  element = null;
  fileName = null;
  rowID = null;
  emitter = null;

  state = {
    activeRowID: '',
    expanded: false,
    name: '',
    path: '',
    descriptions: [],
    expandedDescRows: [],
    onClick: () => {},
  };

  constructor(fileName, emitter) {
    this.fileName = fileName;
    this.rowID = `row-file-${fileName}`;
    this.emitter = emitter;

    this.element = document.createElement('div');
    this.element.classList.add('row-file');

    this.emitter.on('panelState', panelState => this.onChangePanelState(panelState));
  }

  update(branchData) {
    let needRender = false;
    keys(branchData).forEach(key => {
      if (!isEqual(this.state[key], branchData[key])) {
        needRender = true;
        this.state[key] = branchData[key];
      }
    });

    const firstDesc = this.state.descriptions[0];
    if (!firstDesc) {
      Logger.log(`Problem branch ${this.fileName}: no descriptions`);
      return;
    }

    this.state.name = firstDesc.localName;
    this.state.path = firstDesc.localPath;

    if (needRender) {
      this.render();
    }
  }

  render() {
    const { expanded, descriptions, onClick } = this.state;
    this.clearElement();

    const mainRow = this.renderMainRow();
    mainRow.onclick = (event) => onClick({
      event,
      type: 'row-file',
      fileName: this.fileName,
      rowID: this.rowID,
    });

    this.element.appendChild(mainRow);

    if (expanded) {
      descriptions.forEach(description => {
        const { startRow } = description;
        const id = `row-description-${this.fileName}-${startRow}`;
        const descriptionRow = this.renderDescriptionRow(id, description);

        this.element.appendChild(descriptionRow);
      });
    }
  }

  renderMainRow() {
    const { name, path, descriptions, activeRowID, expanded } = this.state;

    const mainRow = document.createElement('div');
    mainRow.classList.add('row-file-main');
    if (activeRowID === this.rowID) {
      mainRow.classList.add('active');
    }

    const icon = expanded ? icons.expanded : icons.collapsed;

    mainRow.innerHTML = `
      ${icon}
      <div class="name">${name}</div>
      <div class="path">${path}</div>
      <div class="badge">${descriptions.length}</div>
    `;

    return mainRow;
  }

  renderDescriptionRow(id, description) {
    const { expandedDescRows, activeRowID, onClick } = this.state;
    const { severity, message, startRow, startCol, markers } = description;

    const descriptionRow = document.createElement('div');
    descriptionRow.classList.add('row-description');

    const descriptionMainRow = document.createElement('div');
    descriptionMainRow.classList.add('row-description-main');
    if (activeRowID === id) {
      descriptionMainRow.classList.add('active');
    }

    const isExpanded = expandedDescRows.includes(id);
    const iconExpand = isExpanded ? icons.expanded : icons.collapsed;
    const iconSeverity = `<div class="icon ${SEVERITY_ICONS[severity]} ${SEVERITY_CLASSES[severity]}"></div>`;

    descriptionMainRow.innerHTML = `
      ${iconExpand}
      ${iconSeverity}
      <div class="message">${message}</div>
    `;

    descriptionMainRow.onclick = (event) => {
      event.stopPropagation();
      onClick({
        event,
        type: 'row-description',
        fileName: this.fileName,
        rowID: id,
        startRow,
        startCol,
      });
    };

    descriptionRow.appendChild(descriptionMainRow);
    if (isExpanded) {
      markers.forEach(marker => {
        const { markerID } = marker;
        // eslint-disable-next-line no-shadow
        const id = `row-marker-${markerID}`;

        const markerRow = this.renderMarkerRow(id, marker);
        descriptionRow.appendChild(markerRow);
      });
    }

    return descriptionRow;
  }

  renderMarkerRow(id, marker) {
    const { activeRowID, name, onClick } = this.state;
    const { startRow, startCol } = marker;

    const markerRow = document.createElement('div');
    markerRow.classList.add('row-marker');
    if (activeRowID === id) {
      markerRow.classList.add('active');
    }

    markerRow.innerHTML = `
      <div class="pos">${name} [${startRow}, ${startCol}]:</div>
      <div class="info">Issue helper</div>
    `;

    markerRow.onclick = (event) => {
      event.stopPropagation();
      onClick({
        event,
        type: 'row-marker',
        fileName: this.fileName,
        rowID: id,
        startRow,
        startCol,
      });
    };

    return markerRow;
  }

  onChangePanelState(panelState) {
    this.update({
      activeRowID: panelState.activeRowID,
      expanded: panelState.expandedFileRows.includes(this.rowID),
      expandedDescRows: panelState.expandedDescRows.filter(id => id.includes(`row-description-${this.fileName}`)),
    });
  }

  clearElement() {
    while (this.element.firstChild) {
      this.element.removeChild(this.element.firstChild);
    }
  }

  getElement() {
    return this.element;
  }

  getID() {
    return this.rowID;
  }
}
