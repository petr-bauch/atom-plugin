'use babel';

import { isNumber } from 'lodash';

import { Store } from './Store';
import { STORE_KEYS } from '../constants/store';
import { HttpModule } from './HttpModule';
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
    // TODO
    console.log('Analysis results:');
    console.log(rawResults);
    return Promise.resolve(rawResults);
  }
}

const AnalyserInstance = new Analyser();

export { AnalyserInstance as Analyser };
