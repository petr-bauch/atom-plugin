'use babel';

export const config = {
	analyseOnChange: {
		type: 'boolean',
		default: true,
		title: 'Analyse on change',
		description: 'Allows perform analysis on every time files are changed (with custom delay). Default: true',
	},
	analyseOnChangeDelay: {
		type: 'integer',
		default: 30,
		minimum: 10,
		maximum: 3600,
		title: 'Delay for analyse on change',
		description: 'Delay in seconds between starting analysis for changed files. Default: 30 sec',
	},
	debugLog: {
		type: 'boolean',
		default: false,
		title: 'Use debug log',
		description: 'Allows output debug messages to console. Default: false',
	},
};
