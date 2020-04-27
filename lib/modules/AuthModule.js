'use babel';

import open from 'open';

import { Store } from './Store';
import { HttpModule } from './HttpModule';
import { Logger } from './Logger';
import { CUSTOM_EVENTS, STORE_KEYS } from '../constants/store';
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

    const { error, isLoggedIn } = await HttpModule.checkSession(sessionToken);
    if (error) {
      Store.set(STORE_KEYS.loginInProcess, false);
      const message = (error && error.message) || 'Login failed';
      atom.notifications.addError(message, { dismissable: true });
      return;
    }

    if (isLoggedIn) {
      Store.setMany({
        [STORE_KEYS.loginInProcess]: false,
        [STORE_KEYS.accountType]: 'free',
      });
      atom.config.set(`${PLUGIN.name}.sessionToken`, sessionToken);
      Store.emit(CUSTOM_EVENTS.didLogin);

      Logger.log('Login successful!');

      return;
    }

    setTimeout(() => {
      this.checkSession();
    }, 1000);
  }

  async checkLogin() {
    const sessionToken = Store.get(STORE_KEYS.sessionToken);
    const { error, isLoggedIn } = await HttpModule.checkSession(sessionToken);
    if (error) {
      return false;
    }

    return isLoggedIn;
  }
}

const AuthModuleInstance = new AuthModule();

export { AuthModuleInstance as AuthModule };
