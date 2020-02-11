'use babel';

import { keys } from 'lodash';

import { STORE_KEYS } from '../lib/constants/store';
import {
  mockState,
  mockBundle,
  mockAnalysisResults,
  mockAnalysisTable,
  bundleID as mockBundleID,
} from './mocks';

describe('Deepcode Plugin tests', () => {
  let workspaceElement;
  let activationPromise;
  let dcPackage;

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);
    activationPromise = async () => {
      await atom.packages.activatePackage('deepcode');
      const pkg = atom.packages.getActivePackage('deepcode');

      dcPackage = pkg.mainModule;

      dcPackage.setPluginState(mockState);
      dcPackage.initHTTP(mockState[STORE_KEYS.serviceURL]);

      return Promise.resolve();
    }
  });

  describe('Pre-test configuring', () => {
    beforeEach(() => {
      waitsForPromise(activationPromise);
    });

    it('configured Shared state properly', () => {
      const state = dcPackage.getPluginState();
      const keys = [
        STORE_KEYS.accountType,
        STORE_KEYS.sessionToken,
        STORE_KEYS.serviceURL,
      ];
      for (const key of keys) {
        expect(state[key]).toEqual(mockState[key]);
      }
    });

    it('configured Project state properly', () => {
      const state = dcPackage.getPluginState();
      const keys = [
        STORE_KEYS.confirmedFolders,
        STORE_KEYS.allowedFiles,
        STORE_KEYS.bundleID,
      ];
      for (const key of keys) {
        expect(state[key]).toEqual(mockState[key]);
      }
    });
  });

  describe('Fetching files filters list', () => {
    beforeEach(() => {
      waitsForPromise(activationPromise);
    });

    it('fetches filters from server', () => {
      dcPackage.setPluginState({
        [STORE_KEYS.allowedFiles]: {},
      });

      runs(() => {
        dcPackage.checkFilters(result => {
          expect(result).toEqual(mockState[STORE_KEYS.allowedFiles]);
        });
      });
    });
  });

  describe('Creating hashes bundle', () => {
    beforeEach(() => {
      waitsForPromise(activationPromise);
    });

    it('creates bundle', () => {
      waitsForPromise(async () => {
        const bundle = await dcPackage.createBundle();

        console.log('Test #4: It creates bundle', { bundle, mockBundle });

        for (const key of keys(mockBundle.files)) {
          const hash = bundle.files[key];
          const mockHash = mockBundle.files[key];

          expect(hash).toEqual(mockHash);
        }
      });
    });
  });

  describe('Creating remote bundle', () => {
    beforeEach(() => {
      waitsForPromise(activationPromise);
    });

    it('creates remote bundle', () => {
      dcPackage.setPluginState({
        [STORE_KEYS.bundleID]: '',
      });

      waitsForPromise(async () => {
        const { bundleId, chunks } = await dcPackage.createRemoteBundle(mockBundleID);

        console.log('Test #5: It creates remote bundle', { bundleId, chunks });

        expect(bundleId).toEqual(mockBundleID);
        expect(chunks.length).toEqual(1);
        expect(chunks[0].length).toEqual(4);
      })
    });
  });

  describe('Analyzing', () => {
    beforeEach(() => {
      waitsForPromise(activationPromise);
    });

    it('analyses bundle', () => {
      dcPackage.setPluginState({
        [STORE_KEYS.analysisResults]: { origin: {}, table: [] },
        [STORE_KEYS.analysisURL]: '',
      });

      waitsForPromise(async () => {
        const { origin, table } = await dcPackage.checkAnalysis(mockAnalysisResults);
        console.log('Test #6: It analyses bundle', { origin, table, mockAnalysisResults, mockAnalysisTable });

        expect(origin).toEqual(mockAnalysisResults);
        expect(table).toEqual(mockAnalysisTable);
      })
    });
  });
});
