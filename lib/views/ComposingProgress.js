'use babel';

import { ProgressBar } from './ProgressBar';

export class ComposingProgress {

  refs = {
    statusButton: null,
    progressContainer: null,
    progressBar: null,
  };

  tooltips = {
    progress: null,
  };

  constructor(statusButton) {
    this.refs.statusButton = statusButton;
    this.refs.progressBar = new ProgressBar();
  }

  show() {
    if (this.tooltips.progress) {
      return;
    }

    const item = this.render();
    this.tooltips.progress = atom.tooltips.add(this.refs.statusButton, {
      item,
      placement: 'top',
      trigger: 'manual',
      class: 'dc-tooltip',
    });
  }

  hide() {
    if (this.tooltips.progress) {
      this.tooltips.progress.dispose();
    }
    this.refs.progressContainer = null;
    this.tooltips.progress = null;
  }

  render() {
    this.refs.progressContainer = document.createElement('div');
    this.refs.progressContainer.classList.add('dc-composing-container');

    const icon = document.createElement('div');
    icon.classList.add('icon', 'icon-sync');

    const infoContainer = document.createElement('div');
    infoContainer.classList.add('info-container');

    const title = document.createElement('div');
    title.classList.add('title');
    title.innerText = 'Composing files for bundle...';

    const progressBar = this.refs.progressBar.getElement();

    infoContainer.appendChild(title);
    infoContainer.appendChild(progressBar);

    this.refs.progressContainer.appendChild(icon);
    this.refs.progressContainer.appendChild(infoContainer);

    this.refs.progressBar.start();

    return this.refs.progressContainer;
  }
}
