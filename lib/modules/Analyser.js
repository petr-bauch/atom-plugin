'use babel';

import { Store } from './Store';
import { STORE_KEYS } from '../constants/store';

class Analyser {

  async getBundleID() {
    const bundleID = Store.get(STORE_KEYS.bundleID);
    return Promise.resolve(bundleID);
  }

  async startAnalysisLoop() {

    const bundleID = await this.getBundleID();
    if (!bundleID) {
      console.log('Analysis: no bundle ID');
      return Promise.resolve();
    }

    
  }
}

const AnalyserInstance = new Analyser();

export { AnalyserInstance as Analyser };
