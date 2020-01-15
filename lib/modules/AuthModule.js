'use babel';

import open from 'open';

import { Store } from './Store';
import { HttpModule } from './HttpModule';
import { Logger } from './Logger';
import { STORE_KEYS } from '../constants/store';
import { PLUGIN } from '../constants/common';

class AuthModule {
  async login() {
    const { error, sessionToken, loginURL } = await HttpModule.login();
    if (error) {
      Store.set(STORE_KEYS.loginInProcess, false);
      atom.notifications.addError(error.message, { dismissable: true });
      return;
    }

    Store.set(STORE_KEYS.sessionToken, sessionToken);

    setTimeout(() => {
      this.checkSession();
    }, 1000);

    await open(loginURL);
  }

  async checkSession() {
    const inProgress = Store.get(STORE_KEYS.loginInProcess);
    if (!inProgress) {
      return;
    }

    Logger.log('Check session (login progress)...');
    const sessionToken = Store.get(STORE_KEYS.sessionToken);

    const { error, statusCode, type } = await HttpModule.checkSession(sessionToken);
    if (error || (statusCode !== 200 && statusCode !== 304)) {
      Store.set(STORE_KEYS.loginInProcess, false);
      const message = (error && error.message) || 'Login failed';
      atom.notifications.addError(message, { dismissable: true });
      return;
    }

    if (statusCode === 200) {
      Store.setMany({
        [STORE_KEYS.loginInProcess]: false,
        [STORE_KEYS.accountType]: type || 'free',
      });
      Logger.log('Login successful!');
      atom.config.set(`${PLUGIN.name}.sessionToken`, sessionToken);
      return;
    }

    setTimeout(() => {
      this.checkSession();
    }, 1000);
  }

  async checkLogin() {
    const sessionToken = Store.get(STORE_KEYS.sessionToken);
    const { statusCode } = await HttpModule.checkSession(sessionToken);
    if (statusCode === 200) {
      return true;
    }

    return false;
  }
}

const AuthModuleInstance = new AuthModule();

export { AuthModuleInstance as AuthModule };
