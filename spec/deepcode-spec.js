'use babel';

import { STORE_KEYS } from '../lib/constants/store';
import { mockState, startMockServer } from './mocks';

startMockServer();

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
        STORE_KEYS.firstStart,
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

    it('fetched filters from server', () => {

      dcPackage.setPluginState({
        [STORE_KEYS.allowedFiles]: {},
      });

      const checkFiltersPromise = new Promise(resolve => {
        dcPackage.checkFilters();
        resolve();
      });

      waitsForPromise(() => checkFiltersPromise);

      const state = dcPackage.getPluginState();
      console.log('deepcode-spec.js,  [75]: ', { state });

      expect(state[STORE_KEYS.allowedFiles]).toEqual(mockState[STORE_KEYS.allowedFiles]);
    })
  })
});
