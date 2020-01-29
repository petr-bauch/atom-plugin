'use babel';

import { isNumber, keys, uniqBy, groupBy, orderBy } from 'lodash';

import { Store } from './Store';
import { HttpModule } from './HttpModule';
import { FileUtils } from './FileUtils';
import { Logger } from './Logger';
import { CommonUtils } from './CommonUtils';

import { STORE_KEYS } from '../constants/store';
import { ANALYSIS_STATUS, EMPTY_RESULT, SEVERITY } from '../constants/analysis';

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

    Store.setMany({
      [STORE_KEYS.analysisInProgress]: inProgress,
      [STORE_KEYS.analysisCompleted]: completed,
      [STORE_KEYS.analysisStatus]: status,
      [STORE_KEYS.analysisURL]: analysisURL,
      [STORE_KEYS.analysisWasStarted]: true,
    });

    if (status === ANALYSIS_STATUS.done) {
      const adaptedResults = await this.adaptResults(analysisResults);
      Store.set(STORE_KEYS.analysisResults, adaptedResults);
    }

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
        ...EMPTY_RESULT,
        origin: rawResults,
      };
    }

    /**
     * Table is a tree with the follow shape:
     *
     * const table = [
     *    {
     *      rowID: 'row-file-/absolute-path-to-project/src/components/TableDragResize/TableDragResize.js',
     *      localName: 'TableDragResize.js',
     *      localPath: '/src/components/TableDragResize/TableDragResize.js',
     *      fileName: '/absolute-path-to-project/src/components/TableDragResize/TableDragResize.js',
     *      critical: 0,
     *      warning: 1,
     *      info: 1,
     *      descriptions: [
     *        {
     *          rowID: 'row-description-/absolute-path-to-project/src/components/TableDragResize/TableDragResize.js-183',
     *          severity: 1 | 2 | 3, // (Info | Warning | Critical)
     *          suggestionID: 'NoZeroReturnedInSort',
     *          message: 'The callback provided to sort should return 0 if the compared values are equal',
     *          startRow: 183,
     *          startCol: 22,
     *          markers: [
     *            {
     *              markerID: 'dcMarker-/absolute-path-to-project/src/components/TableDragResize/TableDragResize.js-183-22',
     *              rowID: 'row-marker-/absolute-path-to-project/src/components/TableDragResize/TableDragResize.js-183-22',
     *              suggestionID: 'NoZeroReturnedInSort',
     *              startRow: 183,
     *              startCol: 22,
     *              endRow: 183,
     *              endCol: 34,
     *            }
     *          ],
     *        },
     *      ],
     *    },
     * ]
     */

    const { files, suggestions } = rawResults;
    const table = [];
    const fileNames = keys(files);

    fileNames.forEach(fileName => {
      const fileRow = {
        fileName,
        rowID: CommonUtils.makeFileRowID(fileName),
        localName: FileUtils.getLocalFileName(fileName),
        localPath: FileUtils.getLocalFolderName(fileName),
        critical: 0,
        warning: 0,
        info: 0,
      };

      const descriptions = [];
      const fileSuggestions = files[fileName]; // { 4: [...], 6: [...] }
      const suggestionsIndexes = keys(fileSuggestions); // [4, 6]

      suggestionsIndexes.forEach(suggestionIndex => {
        const suggestion = suggestions[suggestionIndex];
        const { message, severity, id } = suggestion;
        const suggestionID = CommonUtils.deriveSuggestionID(id);

        const localSuggestions = fileSuggestions[suggestionIndex]; // [{ cols rows, markers }, { cols rows, markers }]
        localSuggestions.forEach(suggestionData => {
          const { cols, rows, markers } = suggestionData;
          const startRow = rows[0];
          const startCol = cols[0];
          const endRow = rows[1];
          const endCol = cols[1];

          const descriptionRow = {
            rowID: CommonUtils.makeDescriptionRowID(fileName, startRow),
            severity,
            suggestionID,
            message,
            startRow,
            startCol,
            endRow,
            endCol,
          };

          const flatMarkers = markers.map(marker => {
            const { msg, pos } = marker;
            // eslint-disable-next-line no-shadow
            const { cols, rows } = pos[0];
            const markerID = `dcMarker-${fileName}-${rows[0]}-${cols[0]}`;

            return {
              markerID,
              suggestionID,
              rowID: CommonUtils.makeMarkerRowID(fileName, rows[0], cols[0]),
              message: message.substring(msg[0], msg[1] + 1),
              startRow: rows[0],
              startCol: cols[0],
              endRow: rows[1],
              endCol: cols[1],
            };
          });

          descriptionRow.markers = uniqBy(flatMarkers, 'markerID');
          descriptions.push(descriptionRow);
        });
      });

      // count severities for every file (uniq only)
      let critical = 0;
      let warning = 0;
      let info = 0;

      const groupedDescriptions = groupBy(descriptions, (desc) => desc.message);
      keys(groupedDescriptions).forEach(key => {
        const desc = groupedDescriptions[key][0];
        critical += desc.severity === SEVERITY.critical ? 1 : 0;
        warning += desc.severity === SEVERITY.warning ? 1 : 0;
        info += desc.severity === SEVERITY.info ? 1 : 0;
      });

      fileRow.descriptions = descriptions;
      fileRow.critical = critical;
      fileRow.warning = warning;
      fileRow.info = info;

      table.push(fileRow);
    });

    // sort table by severities
    const sortedTable = orderBy(
      table,
      ['critical', 'warning', 'info', 'fileName'],
      ['desc', 'desc', 'desc', 'asc'],
    );

    const result = {
      origin: rawResults,
      table: sortedTable,
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
