'use babel';

import { PLUGIN } from '../constants/common';

export class ProblemsPanel {

  constructor() {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('deepcode');

    // Create message element
    const message = document.createElement('div');
    this.element.appendChild(message);

    this.subscriptions = atom.workspace.getCenter().observeActivePaneItem((item) => {
      if (!atom.workspace.isTextEditor(item)) {
        message.innerText = 'Open a file to see important information about it.';
        return;
      }
      message.innerHTML = `
        <h2>${item.getFileName() || 'untitled'}</h2>
        <ul>
          <li><b>Soft Wrap:</b> ${item.softWrapped}</li>
          <li><b>Tab Length:</b> ${item.getTabLength()}</li>
          <li><b>Encoding:</b> ${item.getEncoding()}</li>
          <li><b>Line Count:</b> ${item.getLineCount()}</li>
        </ul>
      `;
    });
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
