'use babel';

const prefix = 'publicapi';

export const API = {
  login: `${prefix}/login`,
  session: `${prefix}/session`,
  filters: `${prefix}/filters`,

  createBundle: `${prefix}/bundle`,
  checkBundle: (bundleID) => `${prefix}/bundle/${bundleID}`,
  extendBundle: (bundleID) => `${prefix}/bundle/${bundleID}`,
};
