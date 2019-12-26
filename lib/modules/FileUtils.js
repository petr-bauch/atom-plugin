'use babel';

import fs from 'fs';
import crypto from 'crypto';
import ignore from 'ignore';

import { Store } from './Store';
import { STORE_KEYS } from '../constants/store';
import {
  EXCLUDED_NAMES,
  HASH_ALGORITHM,
  ENCODE_TYPE,
} from '../constants/files';

class FileUtils {

  ig = ignore();
  projectPaths = [];

  constructor() {
    this.projectPaths = this.getProjectPaths();
    this.initIgnore();
  }

  getProjectPaths() {
    const projectPaths = atom.project.getPaths();
    if (!Array.isArray(projectPaths) || projectPaths.length === 0) {
      return [];
    }

    return projectPaths;
  }

  getMainProjectPath() {
    return this.projectPaths[0];
  }

  initIgnore() {
    this.ig.add(EXCLUDED_NAMES);
    this.projectPaths.forEach(path => {
      const gitignorePath = `${path}/.gitignore`;
      fs.readFile(gitignorePath, (err, buffer) => {
        if (err) {
          return;
        }
        this.ig.add(buffer.toString());
      });
      const dcignorePath = `${path}/.dcignore`;
      fs.readFile(dcignorePath, (err, buffer) => {
        if (err) {
          return;
        }
        this.ig.add(buffer.toString());
      });
    });
  }

  getUnconfirmedProjectFolders() {
    const confirmedFolders = Store.get(STORE_KEYS.confirmedFolders);
    return this.projectPaths.filter(projectFolder => !confirmedFolders.includes(projectFolder));
  }

  getConfirmedProjectFolders() {
    const confirmedFolders = Store.get(STORE_KEYS.confirmedFolders);
    return this.projectPaths.filter(projectFolder => confirmedFolders.includes(projectFolder));
  }

  isIgnored(filePath) {
    for (const projectPath of this.projectPaths) {
      const relativePath = filePath.replace(`${projectPath}/`, '');
      const ignored = this.ig.ignores(relativePath);
      if (ignored) {
        return true;
      }
    }

    return false;
  }

  createFileHash(filePath) {
    return crypto
      .createHash(HASH_ALGORITHM)
      .update(filePath)
      .digest(ENCODE_TYPE);
  };
}

const FileUtilsInstance = new FileUtils();

export { FileUtilsInstance as FileUtils };
