'use babel';

import { Emitter } from 'atom';
import { STORE_KEYS, SHARED_STORE_KEYS, PROJECT_STORE_KEYS } from '../constants/store';

const initState = {
  // shared
  [STORE_KEYS.accountType]: '',
  [STORE_KEYS.sessionToken]: '',
  [STORE_KEYS.serviceURL]: '',
  // project
  [STORE_KEYS.confirmedFolders]: [],
  [STORE_KEYS.projectFiles]: {},
  [STORE_KEYS.allowedFiles]: {
    extensions: [],
    configFiles: [],
  },
  [STORE_KEYS.bundleID]: '',
  // runtime
  [STORE_KEYS.loginInProcess]: false,
  [STORE_KEYS.scanningInProcess]: false,
  [STORE_KEYS.scanningFolder]: '',
};

class Store {

  emitter = null;
  state = {};
  flags = {
    isConfigured: () => false,
    isLoggedIn: () => false,
  };

  constructor() {
    this.emitter = new Emitter();
  }

  init(sharedState = {}, projectState = {}) {
    Object.keys(initState).forEach(key => {
      const initValue = initState[key];
      const sharedValue = sharedState[key];
      const projectValue = projectState[key];

      this.state[key] = sharedValue || projectValue || initValue;
    });

    this.flags.isConfigured = () => Boolean(this.get(STORE_KEYS.serviceURL));
    this.flags.isLoggedIn = () => Boolean(this.get(STORE_KEYS.sessionToken) && this.get(STORE_KEYS.accountType));
  }

  reset() {
    const oldState = Object.assign({}, this.getState());
    const events = [];

    Object.keys(initState).forEach(key => {
      const oldValue = oldState[key];
      const newValue = initState[key];
      this.state[key] = newValue;
      events.push(() => {
        this.emitter.emit(key, { key, oldValue, newValue });
      });
    });

    const newState = Object.assign({}, this.getState());
    events.push(() => {
      this.emitter.emit(STORE_KEYS.state, { key: STORE_KEYS.state, oldValue: oldState, newValue: newState });
    });

    events.forEach(emit => emit());
  }

  validateKey(storeKey) {
    const isStoreKey = Object.values(STORE_KEYS).includes(storeKey);
    if (!isStoreKey) {
      const message = `Key ${storeKey} is not valid Store key`;
      console.error(`Key ${storeKey} is not valid Store key`);
      atom.notifications.addError(message, { dismissable: true });
    }

    return isStoreKey;
  }

  getState() {
    return this.state;
  }

  getSharedState() {
    const state = this.getState();
    const sharedState = SHARED_STORE_KEYS.reduce((res, key) => {
      res[key] = state[key];
      return res;
    }, {});

    return sharedState;
  }

  getProjectState() {
    const state = this.getState();
    const projectState = PROJECT_STORE_KEYS.reduce((res, key) => {
      res[key] = state[key];
      return res;
    }, {});

    return projectState;
  }

  get(storeKey) {
    this.validateKey(storeKey);
    return this.state[storeKey];
  }

  set(storeKey, value) {
    const oldState = Object.assign({}, this.getState());
    const oldValue = oldState[storeKey];

    this.state[storeKey] = value;
    const newState = Object.assign({}, this.getState());

    this.emitter.emit(storeKey, { key: storeKey, oldValue, newValue: value });
    this.emitter.emit(STORE_KEYS.state, { key: STORE_KEYS.state, oldValue: oldState, newValue: newState });
  }

  setMany(partialState) {
    const oldState = Object.assign({}, this.getState());
    const events = [];

    Object.keys(partialState).forEach(key => {
      const oldValue = oldState[key];
      const newValue = partialState[key];
      this.state[key] = newValue;
      events.push(() => {
        this.emitter.emit(key, { key, oldValue, newValue });
      });
    });

    const newState = Object.assign({}, this.getState());
    events.push(() => {
      this.emitter.emit(STORE_KEYS.state, { key: STORE_KEYS.state, oldValue: oldState, newValue: newState });
    });

    events.forEach(emit => emit());
  }

  on(eventName, callback, ...args) {
    this.emitter.on(eventName, callback, ...args);
  }
}

const StoreInstance = new Store();

export { StoreInstance as Store };
