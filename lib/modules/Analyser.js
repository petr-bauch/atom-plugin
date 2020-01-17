'use babel';

import { isNumber, keys, sortBy } from 'lodash';

import { Store } from './Store';
import { HttpModule } from './HttpModule';
import { FileUtils } from './FileUtils';
import { Logger } from './Logger';

import { STORE_KEYS } from '../constants/store';
import { ANALYSIS_STATUS } from '../constants/analysis';
import { PLUGIN } from '../constants/common';
import { CommonUtils } from './CommonUtils';

const loopDelay = 1000;

class Analyser {

  async startAnalysisLoop() {

    const bundleID = Store.get(STORE_KEYS.bundleID);
    if (!bundleID) {
      Logger.log('Analysis: no bundle ID');
      return Promise.resolve();
    }

    Store.set(STORE_KEYS.analysisInProgress, true);

    await CommonUtils.sleep(100);
    const { status, completed, analysisResults, analysisURL } = await this.checkAnalysis();

    const inProgress = (
      status === ANALYSIS_STATUS.fetching
      || status === ANALYSIS_STATUS.analyzing
      || status === ANALYSIS_STATUS.dcDone
    );

    const adaptedResults = await this.adaptResults(analysisResults);

    Store.setMany({
      [STORE_KEYS.analysisInProgress]: inProgress,
      [STORE_KEYS.analysisCompleted]: completed,
      [STORE_KEYS.analysisStatus]: status,
      [STORE_KEYS.analysisResults]: adaptedResults,
      [STORE_KEYS.analysisURL]: analysisURL,
      [STORE_KEYS.analysisWasStarted]: true,
    });

    if (inProgress) {
      this.nextAnalysisLoopTick();
    }

    return Promise.resolve();
  }

  async nextAnalysisLoopTick() {
    setTimeout(async () => {
      await this.startAnalysisLoop();
    }, loopDelay);

    return Promise.resolve();
  }

  async checkAnalysis() {
    const bundleID = Store.get(STORE_KEYS.bundleID);
    const sessionToken = Store.get(STORE_KEYS.sessionToken);

    const response = await HttpModule.checkAnalysis(sessionToken, bundleID);
    const { error, statusCode, status, progress, analysisResults, analysisURL } = response;
    if (statusCode !== 200) {
      Logger.log(error);
      return Promise.resolve({
        status: ANALYSIS_STATUS.failed,
        completed: 0,
        analysisResults: {
          origin: {},
          table: [],
        },
        analysisURL: '',
      });
    }

    const completed = isNumber(progress) ? Math.round(progress * 100) : 0;

    return Promise.resolve({
      status,
      completed,
      analysisResults,
      analysisURL,
    });
  }

  async adaptResults(rawResults) {
    if (!rawResults || !rawResults.files || !rawResults.suggestions) {
      Logger.log('Incorrect analysis results for adapting: ', { rawResults });
      return {
        table: [],
        origin: rawResults,
      };
    }
    /*
    Table columns
    1. Visible:
    - severity: 1 | 2 | 3 (Info | Warning | Critical)
    - localName: TableDragResize.js
    - localPath: /src/components/TableDragResize/TableDragResize.js
    - message: The callback provided to sort should return 0 if the compared values are equal
    - position: [183, 22]

    2. Invisible:
    - fileName: /absolute-path-to-project/src/components/TableDragResize/TableDragResize.js
    - suggestionIndex: 2
    - suggestionID: NoZeroReturnedInSort
    - startRow: 183
    - startCol: 22
    - suggestionData: { cols, rows, markers }

    3. markers[]:
    - message: !=
    - startRow: 183
    - startCol: 22
    - endRow: 183
    - endCol: 34
    - markerID: dcMarker-/src/components/TableDragResize/TableDragResize.js-183-22
    - providerID: deepcode
     */
    const { files, suggestions } = rawResults;
    const table = [];
    const fileNames = keys(files);

    fileNames.forEach(fileName => {
      const localName = FileUtils.getLocalFileName(fileName);
      const localPath = FileUtils.getLocalFolderName(fileName);

      const fileSuggestions = files[fileName]; // { 4: [...], 6: [...] }
      const suggestionsIndexes = keys(fileSuggestions); // [4, 6]

      suggestionsIndexes.forEach(suggestionIndex => {
        const suggestion = suggestions[suggestionIndex];
        const { message, severity, id } = suggestion;
        const suggestionID = decodeURIComponent(id).split('/').reverse()[0];

        const localSuggestions = fileSuggestions[suggestionIndex]; // [{ cols rows, markers }, { cols rows, markers }]
        localSuggestions.forEach(suggestionData => {
          const { cols, rows, markers } = suggestionData;
          const startRow = rows[0];
          const startCol = cols[0];
          const endRow = rows[1];
          const endCol = cols[1];

          const flatMarkers = markers.map(marker => {
            const { msg, pos } = marker;
            // eslint-disable-next-line no-shadow
            const { cols, rows } = pos[0];
            const markerID = `dcMarker-${localPath}-${rows[0]}-${cols[0]}`;

            return {
              markerID,
              providerID: PLUGIN.name,
              message: message.substring(msg[0], msg[1] + 1),
              startRow: rows[0],
              startCol: cols[0],
              endRow: rows[1],
              endCol: cols[1],
            };
          });

          table.push({
            severity,
            localName,
            localPath,
            message,
            position: `[${startRow}, ${startCol}]`,

            fileName,
            suggestionIndex,
            suggestionID,
            startRow,
            startCol,
            endRow,
            endCol,
            suggestionData,
            markers: flatMarkers,
          });
        });
      });
    });

    const result = {
      origin: rawResults,
      table: sortBy(table, 'localPath'),
    };

    Logger.log('Analysis results:');
    Logger.log(result);

    return Promise.resolve(result);
  }

  async clearResults() {
    const adaptedResults = {
      table: [],
      origin: {},
    };

    Store.set(STORE_KEYS.analysisResults, adaptedResults);

    return Promise.resolve(adaptedResults);
  }
}

const AnalyserInstance = new Analyser();

export { AnalyserInstance as Analyser };
