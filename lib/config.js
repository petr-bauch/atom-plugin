'use babel';

import { PLUGIN } from './constants/common';

export const config = {
	serviceURL: {
		type: 'string',
		default: PLUGIN.url,
		title: 'Service URL',
		description: 'An address of server which will be used in order to send code and analyse it',
		order: 1,
	},
	analyseOnChange: {
		type: 'boolean',
		default: true,
		title: 'Analyse on change',
		description: 'Allows perform analysis on every time files are changed (with custom delay). Default: true',
		order: 2,
	},
	analyseOnChangeDelay: {
		type: 'integer',
		default: 10,
		minimum: 1,
		maximum: 3600,
		title: 'Delay for analyse on change',
		description: 'Delay in seconds between starting analysis for changed files. From 1 sec to 1 hour (3600 sec). Default: 10 sec',
		order: 3,
	},
	reScanOnStart: {
		type: 'boolean',
		default: true,
		title: 'Re-scan projects on start',
		description: 'Allows performing full scanning project on start. Otherwise: only analysis with stored bundle',
		order: 4,
	},
	debugLog: {
		type: 'boolean',
		default: false,
		title: 'Use debug log',
		description: 'Allows output debug messages to console. Default: false',
		order: 5,
	},
	sessionToken: {
		type: 'string',
		default: '',
		title: 'Session token',
		description: 'Clear this session token to make re-login',
		order: 6,
	},
};
