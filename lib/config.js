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
	debugLog: {
		type: 'boolean',
		default: false,
		title: 'Use debug log',
		description: 'Allows output debug messages to console. Default: false',
		order: 3,
	},
};
