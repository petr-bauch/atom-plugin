'use babel';

export const STORE_KEYS = {
  state: 'state',
  accountType: 'accountType',
  sessionToken: 'sessionToken',
  confirmedFolders: 'confirmedFolders',
  serviceURL: 'serviceURL',
  loginInProcess: 'loginInProcess',
  scanningInProcess: 'scanningInProcess',
  scanningFolder: 'scanningFolder',
}

export const SHARED_STORE_KEYS = [
  STORE_KEYS.accountType,
  STORE_KEYS.sessionToken,
  STORE_KEYS.confirmedFolders,
  STORE_KEYS.serviceURL,
];
