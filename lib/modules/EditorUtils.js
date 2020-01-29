'use babel';

import { CompositeDisposable } from 'atom';
import { isArray, isEmpty, find } from 'lodash';

import { Store } from './Store';
import { CUSTOM_EVENTS, STORE_KEYS } from '../constants/store';
import { SEVERITY_CLASSES } from '../constants/analysis';
import { MarkerOverlay } from '../views/MarkerOverlay';
import { CommonUtils } from './CommonUtils';

class EditorUtils {

  markerTimeout = null;
  subscriptions = null;

  displayMarkers = new Map();
  textDecorations = new Map();

  editorElements = new Map();
  markerOverlays = new Map();
  mouseListeners = new Map();

  markerOverlayHovered = false;

  constructor() {
    this.subscriptions = new CompositeDisposable();

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onClickIgnoreProblem = this.onClickIgnoreProblem.bind(this);
    this.onOverlayHover = this.onOverlayHover.bind(this);

    Store.on(CUSTOM_EVENTS.overlayHover, (eventData) => this.onOverlayHover(eventData));
    Store.on(CUSTOM_EVENTS.ignoreProblem, (eventData) => this.onClickIgnoreProblem(eventData));
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
    const isOverlayExist = this.markerOverlays.has(fileName);
    if (isOverlayExist) {
      return;
    }

    const editorElement = editor.component.element;
    const isListenerExist = this.mouseListeners.has(fileName);

    if (isOverlayExist) {
      const existedOverlay = this.markerOverlays.get(fileName);
      existedOverlay.element.remove();
    }
    if (isListenerExist) {
      editorElement.removeEventListener('mousemove', this.mouseListeners.get(fileName));
    }

    const markerOverlay = new MarkerOverlay();
    editorElement.appendChild(markerOverlay.getElement());

    const listener = editorElement.addEventListener('mousemove', this.onMouseMove);

    this.editorElements.set(fileName, editorElement);
    this.mouseListeners.set(fileName, listener);
    this.markerOverlays.set(fileName, markerOverlay);

    this.subscriptions.add(editor.onDidDestroy(() => {
      editorElement.removeEventListener('mousemove', listener);

      this.markerOverlays.delete(fileName);
      this.mouseListeners.delete(fileName);
      this.editorElements.delete(fileName);
    }));
  }

  createPoint(row = 1, col = 1, isTile = false) {
    return [row - 1, isTile ? col : col - 1];
  }

  flattenMarkers(fileName) {
    const result = [];

    const { table } = Store.get(STORE_KEYS.analysisResults);
    const fileRows = table && table.filter(row => row.fileName === fileName);
    if (!isArray(fileRows) || isEmpty(fileRows)) {
      return result;
    }

    fileRows.forEach(fileRow => {
      const { descriptions } = fileRow;
      descriptions.forEach(desc => {
        const { message, markers, severity } = desc;
        markers.forEach(marker => {
          result.push({
            marker,
            message,
            severity,
          });
        });
      });
    });

    return result;
  }

  showMarker(event) {
    const { clientX, clientY } = event;

    const editor = atom.workspace.getActiveTextEditor();
    if (!editor) {
      this.hideAllMarkerOverlays();
      return;
    }

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
      if (overlay && overlay instanceof MarkerOverlay) {
        overlay.hide();
      }
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

  createMouseEventForBufferPosition(editor, position) {
    const { component } = editor;
    const { refs } = component;

    const screenPosition = editor.screenPositionForBufferPosition(position);
    const pixelPosition = component.pixelPositionForScreenPosition(screenPosition);
    const linesRect = refs.lineTiles.getBoundingClientRect();

    const clientX = pixelPosition.left + linesRect.left;
    const clientY = pixelPosition.top + linesRect.top + 12;

    return {
      clientX,
      clientY,
    };
  }

  getDescriptionRow(fileName, markerID) {
    const { table } = Store.get(STORE_KEYS.analysisResults);
    if (!isArray(table) || isEmpty(table)) {
      return null;
    }

    const fileRowID = CommonUtils.makeFileRowID(fileName);
    const fileRow = find(table, { rowID: fileRowID });
    if (!fileRow) {
      return null;
    }

    const { descriptions } = fileRow;
    for (const descriptionRow of descriptions) {
      const markerRow = find(descriptionRow.markers, { markerID });
      if (markerRow) {
        return descriptionRow;
      }
    }

    return null;
  }

  removeMarkerRow(fileName, markerID) {
    const { table, origin } = Store.get(STORE_KEYS.analysisResults);
    if (!isArray(table) || isEmpty(table)) {
      return;
    }

    const fileRowID = CommonUtils.makeFileRowID(fileName);
    const fileRow = find(table, { rowID: fileRowID });
    if (!fileRow) {
      return;
    }

    const { descriptions } = fileRow;
    const newDescriptions = [];
    for (const desc of descriptions) {
      const markers = desc.markers.filter(row => row.markerID !== markerID);
      if (markers.length > 0) {
        desc.markers = markers;
        newDescriptions.push(desc);
      }
    }

    if (newDescriptions.length > 0) {
      fileRow.descriptions = newDescriptions;
      Store.set(STORE_KEYS.analysisResults, {
        origin,
        table,
      });

    } else {
      const newTable = table.filter(row => row.rowID !== fileRowID);
      Store.set(STORE_KEYS.analysisResults, {
        origin,
        table: newTable,
      });
    }
  }

  insertIgnoreComment(editor, startRow, startCol, suggestionID, forFile) {

    const reasonText = '<please specify a reason of ignoring this>';
    const ignoreText = `deepcode ignore ${suggestionID}`;
    const resultText = forFile
      ? `file ${ignoreText}: ${reasonText}`
      : `${ignoreText}: ${reasonText}`;

    const startPoint = this.createPoint(startRow, startCol);
    editor.setCursorBufferPosition(startPoint);

    // check if there is another deepcode ignore code
    editor.moveUp(1);
    editor.moveToBeginningOfLine();
    editor.selectToEndOfLine();

    const selectedText = editor.getSelectedText();
    const isIgnoreSuggestion = selectedText.includes(ignoreText);
    const isIgnore = selectedText.includes('deepcode ignore');

    if (isIgnoreSuggestion) {
      return;
    }

    if (!isIgnore) {
      editor.setCursorBufferPosition(startPoint);
      editor.insertNewlineAbove();
      editor.insertText(resultText);
      editor.toggleLineCommentsInSelection();

    } else {
      editor.setCursorBufferPosition(startPoint);
      editor.moveUp(1);
      editor.moveToEndOfLine();
      editor.insertText(`, ${resultText}`);
    }

    editor.moveToEndOfLine();
    editor.selectLeft(reasonText.length);

    editor.save();
  }

  // Events -----------------------------------------------------------------------------------------------------------

  onMouseMove(event) {
    if (this.markerTimeout) {
      clearTimeout(this.markerTimeout);
    }
    if (this.markerOverlayHovered) {
      return;
    }

    this.markerTimeout = setTimeout(() => {
      this.showMarker(event);
      clearTimeout(this.markerTimeout);
    }, 250);
  }

  onClickIgnoreProblem(eventData) {
    const { markerID, forFile } = eventData;
    const editor = atom.workspace.getActiveTextEditor();
    if (!editor) {
      this.hideAllMarkerOverlays();
      return;
    }

    const fileName = editor.getPath();
    const descriptionRow = this.getDescriptionRow(fileName, markerID);
    if (!descriptionRow) {
      this.hideMarkerOverlay(fileName);
      return;
    }

    const { startRow, startCol, suggestionID } = descriptionRow;
    this.insertIgnoreComment(editor, startRow, startCol, suggestionID, forFile);

    this.hideMarkerOverlay(fileName);
    this.removeMarkerRow(fileName, markerID);

    this.clearMarkers(editor);

    setTimeout(() => {
      const currentPane = atom.workspace.paneContainerForItem(editor);
      currentPane.activate();
    }, 500);
  }

  onOverlayHover(eventData) {
    const { hovered } = eventData;
    this.markerOverlayHovered = hovered;
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

    await CommonUtils.sleep(500);

    // imitate mouse event for showing marker overlay
    const mouseEvent = this.createMouseEventForBufferPosition(editor, position);
    this.showMarker(mouseEvent);
  }

  async createMarkersForAllEditors() {
    const editors = atom.workspace.getTextEditors();
    if (!isArray(editors) || isEmpty(editors)) {
      return Promise.resolve();
    }

    const creators = editors.map(async (editor) => {
      await this.createMarkers(editor);
    });

    await Promise.all(creators);
    return Promise.resolve();
  }

  async createMarkers(textEditor = null) {
    const editor = textEditor || atom.workspace.getActiveTextEditor();
    if (!editor) {
      return Promise.resolve();
    }

    // clear all existed markers
    await this.clearMarkers(editor);

    const fileName = editor.getPath();
    this.initOverlays(fileName, editor);

    const flattenMarkers = this.flattenMarkers(fileName);
    if (isEmpty(flattenMarkers)) {
      return Promise.resolve();
    }

    flattenMarkers.forEach(flattenMarker => {
      const { marker, message, severity } = flattenMarker;
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
    const { markerID, startRow, startCol, endRow, endCol } = marker;

    const range = [
      this.createPoint(startRow, startCol),
      this.createPoint(endRow, endCol, true),
    ];
    const displayMarker = editor.markBufferRange(range);
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

  async clearMarkers(textEditor = null) {
    const editor = textEditor || atom.workspace.getActiveTextEditor();
    if (!editor) {
      return Promise.resolve();
    }

    const displayMarkerLayer = editor.getDefaultMarkerLayer();
    const markers = displayMarkerLayer.getMarkers();
    if (!isArray(markers) || isEmpty(markers)) {
      return Promise.resolve();
    }

    const dcMarkers = this.displayMarkers.values();
    for (const dcMarker of dcMarkers) {
      if (markers.includes(dcMarker)) {
        dcMarker.destroy();
      }
    }

    return Promise.resolve();
  }
}

const EditorUtilsInstance = new EditorUtils();

export { EditorUtilsInstance as EditorUtils };
