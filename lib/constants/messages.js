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
};
