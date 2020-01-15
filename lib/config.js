'use babel';

export const config = {
	analyseOnChange: {
		type: 'boolean',
		default: true,
		title: 'Analyse on change',
		description: 'Allows perform analysis on every time files are changed (with custom delay). Default: true',
		order: 1,
	},
	analyseOnChangeDelay: {
		type: 'integer',
		default: 10,
		minimum: 1,
		maximum: 3600,
		title: 'Delay for analyse on change',
		description: 'Delay in seconds between starting analysis for changed files. From 1 sec to 1 hour (3600 sec). Default: 10 sec',
		order: 2,
	},
	debugLog: {
		type: 'boolean',
		default: false,
		title: 'Use debug log',
		description: 'Allows output debug messages to console. Default: false',
		order: 3,
	},
	sessionToken: {
		type: 'string',
		default: '',
		title: 'Session token',
		description: 'Clear this session token to reset plugin',
		order: 4,
	},
};
