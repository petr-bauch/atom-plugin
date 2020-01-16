'use babel';

export const ANALYSIS_STATUS = {
  fetching: 'FETCHING',
  analyzing: 'ANALYZING',
  dcDone: 'DC_DONE',
  done: 'DONE',
  failed: 'FAILED',
};

export const SEVERITY = {
  ok: 0,
  info: 1,
  warning: 2,
  critical: 3,
};

export const SEVERITY_CLASSES = {
  [SEVERITY.ok]: 'ok',
  [SEVERITY.info]: 'info',
  [SEVERITY.warning]: 'warning',
  [SEVERITY.critical]: 'critical',
};

export const SEVERITY_ICONS = {
  [SEVERITY.ok]: 'icon-check',
  [SEVERITY.info]: 'icon-info',
  [SEVERITY.warning]: 'icon-alert',
  [SEVERITY.critical]: 'icon-issue-opened',
};
