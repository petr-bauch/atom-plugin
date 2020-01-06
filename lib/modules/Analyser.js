'use babel';

import { isNumber, keys, sortBy } from 'lodash';

import { Store } from './Store';
import { HttpModule } from './HttpModule';
import { FileUtils } from './FileUtils';

import { STORE_KEYS } from '../constants/store';
import { ANALYSIS_STATUS } from '../constants/analysis';

const loopDelay = 500;

class Analyser {

  async startAnalysisLoop() {

    const bundleID = Store.get(STORE_KEYS.bundleID);
    if (!bundleID) {
      console.log('Analysis: no bundle ID');
      return Promise.resolve();
    }

    Store.set(STORE_KEYS.analysisInProgress, true);

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
    });

    if (inProgress) {
      await this.nextAnalysisLoopTick();
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
      console.log(error);
      return Promise.resolve({
        status: ANALYSIS_STATUS.failed,
        completed: 0,
        analysisResults: {},
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
    - startRow: 183
    - startCol: 22
    - suggestionData: { cols, rows, markers }
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
        const { message, severity } = suggestion;

        const localSuggestions = fileSuggestions[suggestionIndex]; // [{ cols rows, markers }, { cols rows, markers }]
        localSuggestions.forEach(suggestionData => {
          const { cols, rows } = suggestionData;
          const startRow = rows[0];
          const startCol = cols[0];

          table.push({
            severity,
            localName,
            localPath,
            message,
            position: `[${startRow}, ${startCol}]`,

            fileName,
            suggestionIndex,
            startRow,
            startCol,
            suggestionData,
          });
        });
      });
    });

    const result = {
      origin: rawResults,
      table: sortBy(table, 'localPath'),
    };

    console.log('Analysis results:');
    console.log(result);

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
