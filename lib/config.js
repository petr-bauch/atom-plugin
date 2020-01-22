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
	sessionToken: {
		type: 'string',
		default: '',
		title: 'Session token',
		description: 'Clear this session token to make re-login',
		order: 2,
	},
	analyseOnChange: {
		type: 'boolean',
		default: true,
		title: 'Analyse on change',
		description: 'Allows perform analysis on every time files are changed (with custom delay). Default: true',
		order: 3,
	},
	debugLog: {
		type: 'boolean',
		default: false,
		title: 'Use debug log',
		description: 'Allows output debug messages to console. Default: false',
		order: 4,
	},
};
