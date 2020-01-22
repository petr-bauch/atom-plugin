'use babel';

import { Store } from '../modules/Store';
import { SEVERITY, SEVERITY_CLASSES } from '../constants/analysis';
import { CUSTOM_EVENTS } from '../constants/store';

export class MarkerOverlay {

  element = null;
  markerID = null;

  constructor() {
    this.element = document.createElement('div');
    this.element.classList.add('dc-linter-overlay', 'hidden');
  }

  update(model) {
    this.markerID = model.markerID;

    this.element.classList.remove(SEVERITY_CLASSES[SEVERITY.info]);
    this.element.classList.remove(SEVERITY_CLASSES[SEVERITY.warning]);
    this.element.classList.remove(SEVERITY_CLASSES[SEVERITY.critical]);

    this.element.classList.add(SEVERITY_CLASSES[model.severity]);

    this.renderContent(model);

    this.element.style.top = `${model.top}px`;
    this.element.style.left = `${model.left}px`;

    this.element.onmouseenter = (event) => Store.emit(CUSTOM_EVENTS.overlayHover, { event, hovered: true });
    this.element.onmouseleave = (event) => Store.emit(CUSTOM_EVENTS.overlayHover, { event, hovered: false });
  }

  renderContent(model) {
    this.clearContent();

    const message = document.createElement('div');
    message.classList.add('message');
    message.innerText = model.message;

    this.element.appendChild(message);

    const buttonsBox = document.createElement('div');
    buttonsBox.classList.add('buttons-box');

    const btnIgnoreLine = document.createElement('button');
    btnIgnoreLine.classList.add('btn', 'btn-line');
    btnIgnoreLine.innerText = 'Ignore for line';
    btnIgnoreLine.onclick = () => model.onClickIgnoreLine(model.markerID);

    const btnIgnoreFile = document.createElement('button');
    btnIgnoreFile.classList.add('btn', 'btn-file');
    btnIgnoreFile.innerText = 'Ignore for file';
    btnIgnoreFile.onclick = () => model.onClickIgnoreFile(model.markerID);

    buttonsBox.appendChild(btnIgnoreLine);
    buttonsBox.appendChild(btnIgnoreFile);

    this.element.appendChild(buttonsBox);
  }

  clearContent() {
    while (this.element.firstChild) {
      this.element.removeChild(this.element.firstChild);
    }
  }

  show() {
    this.element.classList.remove('hidden');
  }

  hide() {
    this.element.classList.add('hidden');
  }

  getElement() {
    return this.element;
  }

  destroy() {
    this.element.remove();
  }
}
