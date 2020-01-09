'use babel';

import { CompositeDisposable } from 'atom';
import { isArray, isEmpty } from 'lodash';

import { Store } from './Store';
import { STORE_KEYS } from '../constants/store';
import { SEVERITY_CLASSES } from '../constants/analysis';
import { MarkerOverlay } from '../views/MarkerOverlay';

class EditorUtils {

  markerTimeout = null;
  subscriptions = null;

  displayMarkers = new Map();
  textDecorations = new Map();

  editorElements = new Map();
  markerOverlays = new Map();
  mouseListeners = new Map();

  constructor() {
    this.subscriptions = new CompositeDisposable();

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onClickIgnoreLine = this.onClickIgnoreLine.bind(this);
    this.onClickIgnoreFile = this.onClickIgnoreFile.bind(this);
  }

  destroy() {
    this.subscriptions.dispose();
    this.editorElements.forEach((editorElement, fileName) => {
      const listener = this.mouseListeners.get(fileName);
      if (listener) {
        editorElement.removeEventListener('mousemove', listener);
      }
    });
  }

  initOverlays(fileName, editor) {
    if (this.markerOverlays.has(fileName)) {
      return;
    }

    const editorElement = editor.component.element;
    const markerOverlay = new MarkerOverlay();

    editorElement.appendChild(markerOverlay.getElement());
    const listener = editorElement.addEventListener('mousemove', this.onMouseMove);

    this.editorElements.set(fileName, editorElement);
    this.mouseListeners.set(fileName, listener);
    this.markerOverlays.set(fileName, markerOverlay);
  }

  createPoint(row = 1, col = 1, isTile = false) {
    return [row - 1, isTile ? col : col - 1];
  }

  flattenMarkers(fileName) {
    const result = [];

    const { table } = Store.get(STORE_KEYS.analysisResults);
    const records = table && table.filter(rec => rec.fileName === fileName);
    if (!isArray(records) || isEmpty(records)) {
      return result;
    }

    records.forEach(record => {
      const { message, markers, severity } = record;
      markers.forEach(marker => {
        result.push({
          marker,
          message,
          severity,
        });
      });
    });

    return result;
  }

  showMarker(event) {
    const editor = atom.workspace.getActiveTextEditor();
    if (!editor) {
      this.hideAllMarkerOverlays();
      return;
    }

    const { clientX, clientY } = event;
    const pixelPosition = editor.component.pixelPositionForMouseEvent(event);
    const screenPosition = editor.component.screenPositionForPixelPosition(pixelPosition);
    const bufferPosition = editor.bufferPositionForScreenPosition(screenPosition);

    const fileName = editor.getPath();
    const flattenMarkers = this.flattenMarkers(fileName);
    if (isEmpty(flattenMarkers)) {
      this.hideMarkerOverlay(fileName);
      return;
    }

    const { row, column } = bufferPosition;
    const bufferRow = row + 1;
    const bufferCol = column + 1;
    const appropriateFlattenMarker = flattenMarkers.find(flattenMarker => {
      const { startRow, startCol, endRow, endCol } = flattenMarker.marker;
      const isOneLine = (startRow === endRow);
      if (isOneLine) {
        return (
          (bufferRow === startRow)
          && (bufferCol >= startCol && bufferCol <= endCol)
        );
      }

      if (bufferRow === startRow) {
        return (bufferCol >= startCol);
      }

      if (bufferRow === endRow) {
        return (bufferCol <= endCol);
      }

      const startMinRow = Math.min(startRow, endRow);
      const endMaxRow = Math.max(startRow, endRow);
      if (bufferRow > startMinRow && bufferRow < endMaxRow) {
        return true;
      }

      return false;
    });

    if (!appropriateFlattenMarker) {
      this.hideMarkerOverlay(fileName);
      return;
    }

    const { marker, message, severity } = appropriateFlattenMarker;
    const { markerID } = marker;
    const model = {
      markerID,
      message,
      severity,
      top: clientY + 16,
      left: clientX - 22,
      onClickIgnoreLine: this.onClickIgnoreLine,
      onClickIgnoreFile: this.onClickIgnoreFile,
    };

    this.showMarkerOverlay(fileName, model);
  }

  hideMarkerOverlay(fileName) {
    const markerOverlay = this.markerOverlays.get(fileName);
    if (!markerOverlay) {
      return;
    }

    markerOverlay.hide();
  }

  hideAllMarkerOverlays() {
    for (const overlay of this.markerOverlays) {
      overlay.hide();
    }
  }

  showMarkerOverlay(fileName, model) {
    const markerOverlay = this.markerOverlays.get(fileName);
    if (!markerOverlay) {
      return;
    }

    markerOverlay.update(model);
    markerOverlay.show();
  }

  // Events -----------------------------------------------------------------------------------------------------------

  onMouseMove(event) {
    if (this.markerTimeout) {
      clearTimeout(this.markerTimeout);
    }

    this.markerTimeout = setTimeout(() => {
      this.showMarker(event);
      clearTimeout(this.markerTimeout);
    }, 500);
  }

  onClickIgnoreLine(markerID, forFile = false) {
    const editor = atom.workspace.getActiveTextEditor();
    if (!editor) {
      this.hideAllMarkerOverlays();
      return;
    }

    const fileName = editor.getPath();
    const flattenMarkers = this.flattenMarkers(fileName);
    if (isEmpty(flattenMarkers)) {
      this.hideMarkerOverlay(fileName);
      return;
    }

    const flattenMarker = flattenMarkers.find(fm => fm.marker.markerID === markerID);
    if (!flattenMarker) {
      return;
    }

    const { marker } = flattenMarker;
    const { startRow, startCol, suggestionID } = marker;
    const ignoreText = `// ${forFile ? 'file ' : ''}deepcode ignore ${suggestionID}: <please specify a reason of ignoring this>`;

    editor.setCursorBufferPosition(this.createPoint(startRow, startCol));
    editor.insertNewlineAbove();
    editor.insertText(ignoreText);

    this.hideMarkerOverlay(fileName);
  }

  onClickIgnoreFile(markerID) {
    this.onClickIgnoreLine(markerID, true);
  }

  // API --------------------------------------------------------------------------------------------------------------

  async openFile(path = '', row = 1, col = 1) {
    await atom.workspace.open(path);
    const editor = atom.workspace.getActiveTextEditor();
    if (!editor) {
      return;
    }

    const position = this.createPoint(row, col);
    editor.setCursorBufferPosition(position, { autoscroll: true });
  }

  async createMarkers() {
    const editor = atom.workspace.getActiveTextEditor();
    if (!editor) {
      return Promise.resolve();
    }

    const fileName = editor.getPath();
    this.initOverlays(fileName, editor);

    const flattenMarkers = this.flattenMarkers(fileName);
    if (isEmpty(flattenMarkers)) {
      return Promise.resolve();
    }

    flattenMarkers.forEach(flattenMarker => {
      const { marker, message, severity } = flattenMarker;
      const { markerID, providerID } = marker;
      const existedMarkers = editor.findMarkers({ markerID, providerID });
      if (!isEmpty(existedMarkers)) {
        return;
      }

      this.createMarker({
        editor,
        marker,
        message,
        severity,
      });
    });

    return Promise.resolve();
  }

  async createMarker(options = {}) {
    const { editor, marker, severity } = options;
    const { markerID, providerID, startRow, startCol, endRow, endCol } = marker;

    const range = [
      this.createPoint(startRow, startCol),
      this.createPoint(endRow, endCol, true),
    ];
    const displayMarker = editor.markBufferRange(range, { markerID, providerID });

    const textDecoration = editor.decorateMarker(displayMarker, {
      type: 'text',
      class: `dc-linter-${SEVERITY_CLASSES[severity]}`,
    });

    this.displayMarkers.set(markerID, displayMarker);
    this.textDecorations.set(markerID, textDecoration);

    this.subscriptions.add(displayMarker.onDidDestroy(() => {
      this.displayMarkers.delete(markerID);
      this.textDecorations.delete(markerID);
    }));

    return Promise.resolve();
  }
}

const EditorUtilsInstance = new EditorUtils();

export { EditorUtilsInstance as EditorUtils };
