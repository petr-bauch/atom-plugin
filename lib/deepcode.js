'use babel';

import DeepcodeView from './deepcode-view';
import { CompositeDisposable, Disposable } from 'atom';

export default {

  deepcodeView: null,
  modalPanel: null,
  subscriptions: null,
  statusBarTile: null,

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable(
      // Add an opener for our view
      atom.workspace.addOpener(uri => {
        if (uri === 'atom://deepcode-info') {
          return new DeepcodeView();
        }
      }),

      // Register command that toggles this view
      atom.commands.add('atom-workspace', {
        'deepcode:open-info-panel': () => this.openInfoPanel(),
      }),

      // Destroy any DeepcodeView when the package is deactivated
      new Disposable(() => {
        atom.workspace.getPaneItems().forEach(item => {
          if (item instanceof DeepcodeView) {
            item.destroy();
          }
        });
      })
    );
  },

  consumeStatusBar(statusBar) {
    console.log('statusBar', statusBar);
    const elem = document.createElement('span');
    elem.innerText = 'Deepcode';
    this.statusBarTile = statusBar.addRightTile({ item: elem, priority: 100 });
  },

  deactivate() {
    this.subscriptions.dispose();
    this.statusBarTile.destroy()
    this.statusBarTile = null;
  },

  openInfoPanel() {
    atom.workspace.toggle('atom://deepcode-info');
  },

  deserializeDeepcodeView(serialized) {
    console.log('serialized: ', serialized);
    if (!serialized.sessionToken) {
      const item = atom.notifications.addInfo(
        'Use your GitHub or Bitbucket account to authenticate with Deepcode', {
        buttons: [{
          text: 'Login',
          onDidClick: (event) => {
            console.log('Login button has been clicked');
            const token = atom.config.get('deepcode.sessionToken');
            console.log('Saved deepcode.sessionToken: ', token);
            if (!token) {
              atom.config.set('deepcode.sessionToken', 'some-session-token');
              console.log('deepcode.sessionToken has been saved');
            }
            item.dismiss();
          },
        }],
        dismissable: true,
      });
    };

    return new DeepcodeView();
  }
};
