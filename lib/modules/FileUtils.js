'use babel';

import { Store } from './Store';
import { STORE_KEYS } from '../constants/store';

class FileUtils {

  getUnconfirmedProjectFolders() {
    const confirmedFolders = Store.get(STORE_KEYS.confirmedFolders);
    const projectPaths = atom.project.getPaths();
    if (!Array.isArray(projectPaths) || projectPaths.length === 0) {
      return [];
    }

    return projectPaths.filter(projectFolder => !confirmedFolders.includes(projectFolder));
  }
}

const FileUtilsInstance = new FileUtils();

export { FileUtilsInstance as FileUtils };
