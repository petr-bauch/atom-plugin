'use babel';

import { PLUGIN } from './common';

export const MESSAGES = {
  configurePrompt: 'To use the cloud AI backend (https://www.deepcode.ai) select "Cloud". To configure an on-premise AI backend select "On-Premise".',
  configureCloud: 'Cloud',
  configurePremise: 'On-Premise',

  loginPrompt: 'Use your GitHub, Bitbucket or GitLab account to authenticate with DeepCode',
  loginOK: 'Login',

  unauthorized: 'To use DeepCode extension you should login',

  confirmFolderPrompt: (folder) => `Confirm remote analysis of ${folder} ([Terms & Conditions](${PLUGIN.termURL}))`,
  confirmFolderOK: 'Confirm',

  resetSuccessful: 'Plugin settings has been reset successfully. Now you can reload window to start plugin configuring',

  scanProjectNoFolders: 'You have no confirmed folders for this project',

  uploadProgressTitle: 'DeepCode is uploading files...',
  uploadProgressInfo: (completed, total) => `Completed: ${completed} / ${total}`,

  analysisProgressTitle: 'DeepCode is analyzing code...',
  analysisProgressInfo: (completed) => `Completed: ${completed} %`,
};

export const STATUS_BAR_MENU = {
  analyse: 'Analyse code',
  scan: 'Scan project',
  settings: 'Settings',
  reset: 'Reset plugin',
};

export const BUNDLE_ERRORS = {
  create: {
    400: 'Creating bundle: Request content does not match the specifications',
    401: 'Creating bundle: Missing sessionToken or incomplete login process',
    403: 'Creating bundle: Unauthorized access to requested repository',
    413: 'Creating bundle: Payload too large',
  },
  upload: {
    400: 'Uploading files: Content and hash mismatch or attempted to upload files to a git bundle',
    401: 'Uploading files: Missing sessionToken or incomplete login process',
    403: 'Uploading files: Unauthorized access to requested bundle',
    413: 'Uploading files: Payload too large',
  },
  check: {
    401: 'Check bundle: Missing sessionToken or incomplete login process',
    403: 'Check bundle: Unauthorized access to requested bundle',
    404: 'Check bundle: Uploaded bundle has expired',
  },
  extend: {
    400: 'Extending bundle: Attempted to extend a git bundle, or ended up with an empty bundle after the extension',
    401: 'Extending bundle: Missing sessionToken or incomplete login process',
    403: 'Extending bundle: Unauthorized access to parent bundle',
    404: 'Extending bundle: Parent bundle has expired',
    413: 'Extending bundle: Payload too large',
  },
};
