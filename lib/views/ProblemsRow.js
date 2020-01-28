'use babel';

import { keys, isEqual } from 'lodash';

import { Store } from '../modules/Store';

import { SEVERITY_ICONS, SEVERITY_CLASSES, SEVERITY } from '../constants/analysis';
import { CUSTOM_EVENTS } from '../constants/store';

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
    fileRow: {},
    descriptions: [],
    expandedDescRows: [],
    onClick: () => {},
  };

  constructor(rowID, fileName, emitter) {
    this.rowID = rowID;
    this.fileName = fileName;
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

    if (needRender) {
      this.render();
    }
  }

  render() {
    const { expanded, descriptions, onClick } = this.state;
    this.clearElement();

    const fileRow = this.renderFileRow();
    fileRow.onclick = (event) => onClick({
      event,
      type: 'row-file',
      fileName: this.fileName,
      rowID: this.rowID,
    });

    this.element.appendChild(fileRow);

    if (expanded) {
      descriptions.forEach(description => {
        const { rowID } = description;
        const descriptionRow = this.renderDescriptionRow(rowID, description);
        this.element.appendChild(descriptionRow);
      });
    }
  }

  renderFileRow() {
    const { name, path, activeRowID, expanded } = this.state;

    const mainRow = document.createElement('div');
    mainRow.classList.add('row-file-main');
    if (activeRowID === this.rowID) {
      mainRow.classList.add('active');
    }

    const icon = expanded ? icons.expanded : icons.collapsed;
    const badge = this.renderBadge();

    mainRow.innerHTML = `
      ${icon}
      <div class="name">${name}</div>
      <div class="path">${path}</div>
      <div class="badges">${badge}</div>
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
      markers.forEach((marker, index) => {
        const { rowID } = marker;
        const markerRow = this.renderMarkerRow(rowID, marker, index);
        descriptionRow.appendChild(markerRow);
      });
    }

    return descriptionRow;
  }

  renderMarkerRow(id, marker, index) {
    const { activeRowID, name, onClick } = this.state;
    const { startRow, startCol, markerID } = marker;

    const markerRow = document.createElement('div');
    markerRow.classList.add('row-marker');
    if (activeRowID === id) {
      markerRow.classList.add('active');
    }

    const buttons = index === 0
      ? `<div class="row-buttons">
            <button class="row-btn line" data-type="line">Ignore for line</button>
            <button class="row-btn file" data-type="file">Ignore for file</button>
        </div>`
      : '';

    markerRow.innerHTML = `
      <div class="pos">${name} [${startRow}, ${startCol}]:</div>
      <div class="info">Issue helper</div>
      ${buttons}
    `;

    markerRow.onclick = (event) => {
      event.stopPropagation();
      const { target } = event;
      const isButton = ['line', 'file'].includes(target.dataset.type);

      if (!isButton) {
        onClick({
          event,
          type: 'row-marker',
          fileName: this.fileName,
          rowID: id,
          startRow,
          startCol,
        });

        return;
      }

      const forFile = target.dataset.type === 'file';
      Store.emit(CUSTOM_EVENTS.ignoreProblem, { markerID, forFile });
    };

    return markerRow;
  }

  renderBadge() {
    const { fileRow } = this.state;
    const { critical, warning, info } = fileRow;

    // eslint-disable-next-line no-shadow
    const icons = [];
    if (critical > 0) {
      icons.push(this.renderBadgeIcon(SEVERITY.critical, critical));
    }
    if (warning > 0) {
      icons.push(this.renderBadgeIcon(SEVERITY.warning, warning));
    }
    if (info > 0) {
      icons.push(this.renderBadgeIcon(SEVERITY.info, info));
    }

    return icons.join('');
  }

  renderBadgeIcon(severity, count) {
    return `
      <div class="badge-icon ${SEVERITY_CLASSES[severity]}">
        <div class="icon ${SEVERITY_ICONS[severity]}"></div>
        <div>${count}</div>
      </div>
    `;
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
