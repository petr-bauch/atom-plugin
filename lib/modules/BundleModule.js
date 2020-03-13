'use babel';

import { isEmpty } from 'lodash';

import { Store } from './Store';
import { FileWatcher } from '../watchers/FileWatcher';
import { HttpModule } from './HttpModule';
import { CommonUtils } from './CommonUtils';
import { Analyser } from './Analyser';
import { Logger } from './Logger';

import { PLUGIN } from '../constants/common';
import { CUSTOM_EVENTS, STORE_KEYS } from '../constants/store';
import { BUNDLE_EVENTS } from '../constants/emitterEvents';

class BundleModule {
	loopTimeout = null;
	bundleLoopStarted = false;
	changedFiles = [];
	removedFiles = [];

	processedChunks = {}; // cache for processed and stored chunks
	uploadQueueFinished = false;
	uploadQueueErrors = false;

	constructor() {
		Store.on(CUSTOM_EVENTS.didScanSingleFolder, async () => {
			await this.restartBundleLoop();
		});

		const serviceAI = HttpModule.getServiceAI();

		this.onBuildBundleProgress = this.onBuildBundleProgress.bind(this);
		this.onBuildBundleFinish = this.onBuildBundleFinish.bind(this);
		this.onUploadBundleProgress = this.onUploadBundleProgress.bind(this);
		this.onUploadBundleFinish = this.onUploadBundleFinish.bind(this);
		this.onAnalyseProgress = this.onAnalyseProgress.bind(this);
		this.onAnalyseFinish = this.onAnalyseFinish.bind(this);
		this.onError = this.onError.bind(this);

		serviceAI.on(BUNDLE_EVENTS.buildBundleProgress, this.onBuildBundleProgress);
		serviceAI.on(BUNDLE_EVENTS.buildBundleFinish, this.onBuildBundleFinish);
		serviceAI.on(BUNDLE_EVENTS.uploadBundleProgress, this.onUploadBundleProgress);
		serviceAI.on(BUNDLE_EVENTS.uploadFilesFinish, this.onUploadBundleFinish);
		serviceAI.on(BUNDLE_EVENTS.analyseProgress, this.onAnalyseProgress);
		serviceAI.on(BUNDLE_EVENTS.analyseFinish, this.onAnalyseFinish);
		serviceAI.on(BUNDLE_EVENTS.error, this.onError);
	}

	onBuildBundleProgress() {
		setTimeout(async () => {
			await CommonUtils.sleep(100);
			Store.set(STORE_KEYS.composingInProcess, true);
		}, 0);
	}

	onBuildBundleFinish() {
		setTimeout(async () => {
			await CommonUtils.sleep(100);
			Store.set(STORE_KEYS.composingInProcess, false);
		}, 0);
	}

	onUploadBundleProgress(processed, total) {
		setTimeout(async () => {
			Store.setMany({
				[STORE_KEYS.uploadInProgress]: true,
				[STORE_KEYS.uploadCompleted]: processed,
				[STORE_KEYS.uploadTotal]: total,
			});
		}, 0);
	}

	onUploadBundleFinish() {
		setTimeout(async () => {
			Store.set(STORE_KEYS.uploadInProgress, false);
		}, 0);
	}

	onAnalyseProgress(analysisResults) {
		setTimeout(async () => {
			const adaptedResults = await Analyser.adaptResults(analysisResults.analysisResults);
			Store.setMany({
				[STORE_KEYS.analysisResults]: adaptedResults,
				[STORE_KEYS.analysisInProgress]: true,
			});
		}, 0);
	}

	onAnalyseFinish(analysisResults) {
		setTimeout(async () => {
			const adaptedResults = await Analyser.adaptResults(analysisResults.analysisResults);
			const { analysisURL } = analysisResults;
			Store.setMany({
				[STORE_KEYS.analysisResults]: adaptedResults,
				[STORE_KEYS.analysisURL]: analysisURL,
				[STORE_KEYS.analysisInProgress]: false,
				[STORE_KEYS.analyseIsCompleted]: true,
			});
		}, 0);
	}

	onError(error) {
		Logger.log(error);
	}

	async getSessionToken() {
		const sessionToken = Store.get(STORE_KEYS.sessionToken);
		return Promise.resolve(sessionToken);
	}

	async isLoopBlocked() {
		const scanningInProcess = Store.get(STORE_KEYS.scanningInProcess);
		const uploadInProgress = Store.get(STORE_KEYS.uploadInProgress);
		const analysisInProgress = Store.get(STORE_KEYS.analysisInProgress);
		const testingInProgress = Store.get(STORE_KEYS.testEnvironment);

		const isBlocked = scanningInProcess || uploadInProgress || analysisInProgress || testingInProgress;

		return Promise.resolve(isBlocked);
	}

	async updateState() {
		const { changedFiles, removedFiles } = FileWatcher.getState();

		this.changedFiles = changedFiles;
		this.removedFiles = removedFiles;

		return Promise.resolve();
	}

	async resetState() {
		this.changedFiles = [];
		this.removedFiles = [];

		return Promise.resolve();
	}

	async startBundleLoop() {
		if (this.loopTimeout) {
			clearTimeout(this.loopTimeout);
		}

		const isBlocked = await this.isLoopBlocked();
		if (isBlocked) {
			await this.nextBundleLoopTick();
			return Promise.resolve();
		}

		await this.updateState();
		if (isEmpty(this.changedFiles)) {
			Logger.log('No changed files to create/extend bundle');
			await this.nextBundleLoopTick();
			return Promise.resolve();
		}

		if (!this.bundleLoopStarted) {
			Logger.log('Bundle loop started successfully');
			this.bundleLoopStarted = true;
		}

		const sessionToken = await this.getSessionToken();

		Store.set(STORE_KEYS.analyseIsCompleted, false);
		Store.set(STORE_KEYS.analysisURL, '');
		await HttpModule.analyse({
			files: this.changedFiles,
			removedFiles: this.removedFiles,
			sessionToken,
		});

		await FileWatcher.synchronizeBundle(this.changedFiles);
		await this.resetState();

		await this.nextBundleLoopTick();
		return Promise.resolve();
	}

	async nextBundleLoopTick() {
		if (this.loopTimeout) {
			clearTimeout(this.loopTimeout);
		}

		this.loopTimeout = setTimeout(async () => {
			await this.startBundleLoop();
		}, PLUGIN.analysisDelay);

		return Promise.resolve();
	}

	async restartBundleLoop() {
		if (this.loopTimeout) {
			clearTimeout(this.loopTimeout);
		}

		await this.startBundleLoop();

		return Promise.resolve();
	}

	async stopBundleLoop() {
		if (this.loopTimeout) {
			clearTimeout(this.loopTimeout);
		}

		this.loopTimeout = null;
		return Promise.resolve();
	}
}

const BundleModuleInstance = new BundleModule();

export { BundleModuleInstance as BundleModule };
