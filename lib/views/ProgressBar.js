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
    return `${width}%`;
  }

  update(progress, total) {
    this.bar.style.width = this.calculateBar(progress, total);
  }

  start() {
    let progress = 0;
    let increment = 20;

    setInterval(() => {
      progress += increment;

      if (progress > 100) {
        this.element.classList.remove('start');
        this.element.classList.add('end');
        increment = -20;

        this.bar.style.width = this.calculateBar(100, 100);
        return;
      }

      if (progress < 0) {
        this.element.classList.remove('end');
        this.element.classList.add('start');
        increment = 20;

        this.bar.style.width = this.calculateBar(0, 100);
        return;
      }

      this.bar.style.width = this.calculateBar(progress, 100);
    }, 200);
  }
}
