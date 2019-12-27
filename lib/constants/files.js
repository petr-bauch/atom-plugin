'use babel';

import { COMMON_IGNORE_DIRS } from './commonIgnoreDirs';

export const FILE_STATUS = {
  created: 'created',
  modified: 'modified',
  deleted: 'deleted',
  same: 'same',
};

export const CRYPTO = {
  algorithm: 'sha256',
  hashEncode: 'hex',
  fileEncode: 'utf8',
};

export const IGNORES = {
  git: '.git',
  gitIgnore: '.gitignore',
  dcIgnore: '.dcignore',
  idea: '.idea',
};

export const EXCLUDED_NAMES = [
  'node_modules',
  '/node_modules',
  'node_modules/',
  '.git',
  '/.git',
  '.git/',
  '.idea',
  '/.idea',
  '.idea/',
  IGNORES.gitIgnore,
  IGNORES.dcIgnore,
  ...COMMON_IGNORE_DIRS,
];
