'use babel';

export const ANALYSIS_STATUS = {
  fetching: 'FETCHING',
  analyzing: 'ANALYZING',
  dcDone: 'DC_DONE',
  done: 'DONE',
  failed: 'FAILED',
};

export const SEVERITY = {
  info: 1,
  warning: 2,
  critical: 3,
};

export const SEVERITY_ICONS = {
  [SEVERITY.info]: 'icon-info',
  [SEVERITY.warning]: 'icon-issue-opened',
  [SEVERITY.critical]: 'icon-alert',
};
