'use babel';

export class ProgressBar {

  element = null;
  bar = null;

  constructor(type) {
    this.element = document.createElement('div');
    this.element.classList.add('dc-progress-bar-container');

    this.bar = document.createElement('div');
    this.bar.classList.add('dc-bar');

    this.element.appendChild(this.bar);

    this.type = type;
  }

  getElement() {
    return this.element;
  }

  calculateBar(progress, total) {
    const width = total !== 0 ? (progress * 100) / total : 0;
    return `${Math.min(width, 100)}%`;
  }

  update(progress, total) {
    this.bar.style.width = this.calculateBar(progress, total);
  }

  start() {
    this.element.classList.add('start');
    let progress = 0;

    setInterval(() => {
      progress += 20;
      this.bar.style.width = this.calculateBar(progress, 100);
    }, 200);
  }
}
