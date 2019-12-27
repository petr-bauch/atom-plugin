'use babel';

export const STORE_KEYS = {
  state: 'state',
  // shared
  accountType: 'accountType',
  sessionToken: 'sessionToken',
  serviceURL: 'serviceURL',
  // project
  confirmedFolders: 'confirmedFolders',
  projectFiles: 'projectFiles',
  allowedFiles: 'allowedFiles',
  bundleID: 'bundleID',
  // runtime
  loginInProcess: 'loginInProcess',
  scanningInProcess: 'scanningInProcess',
  scanningFolder: 'scanningFolder',
}

export const SHARED_STORE_KEYS = [
  STORE_KEYS.accountType,
  STORE_KEYS.sessionToken,
  STORE_KEYS.serviceURL,
];

export const PROJECT_STORE_KEYS = [
  STORE_KEYS.confirmedFolders,
  STORE_KEYS.projectFiles,
  STORE_KEYS.allowedFiles,
  STORE_KEYS.bundleID,
];
