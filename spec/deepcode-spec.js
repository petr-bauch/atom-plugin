'use babel';

import { STORE_KEYS } from '../lib/constants/store';
import { mockState } from './mocks';

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

    it('Shared state is configured properly', () => {
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

    it('Project state is configured properly', () => {
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

});
