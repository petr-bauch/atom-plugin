'use babel';

import nock from 'nock';

import { STORE_KEYS } from '../lib/constants/store';
import { API } from '../lib/constants/api';

export const mockState = {
  // shared
  [STORE_KEYS.accountType]: 'free',
  [STORE_KEYS.sessionToken]: '444641e35f09d515e366e88ffc0e5929ef42263505d3424184e94040ca7401bc',
  [STORE_KEYS.serviceURL]: 'http://localhost:3000/',

  // project
  [STORE_KEYS.confirmedFolders]: [],
  [STORE_KEYS.allowedFiles]: {
    extensions: [".java", ".html", ".js", ".jsx", ".ts", ".tsx", ".vue", ".py"],
    configFiles: [".pmdrc.xml", ".ruleset.xml", "ruleset.xml", ".eslintrc.js", ".eslintrc.json", ".eslintrc.yml", "tslint.json", ".pylintrc", "pylintrc"],
  },
  [STORE_KEYS.bundleID]: 'gh/deepcode/DEEPCODE_PRIVATE_BUNDLE/ee0745667800961b0f35d6a4cb4fb12f72373d641e75e464f6632813102afcf1',
  [STORE_KEYS.firstStart]: false,
};

export const startMockServer = () => {

  const baseURL = mockState[STORE_KEYS.serviceURL];
  const sessionToken = mockState[STORE_KEYS.sessionToken];

  const mockedServer = nock(baseURL, {
    reqheaders: {
      'Session-Token': sessionToken,
    }
  });

  mockedServer.get(API.filters).reply(200, mockState[STORE_KEYS.allowedFiles]);
};
