'use babel';

/* eslint-disable no-shadow */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import ignore from 'ignore';

import { Store } from './Store';
import { STORE_KEYS } from '../constants/store';
import { EXCLUDED_NAMES, CRYPTO } from '../constants/files';

class FileUtils {

  ig = ignore();
  projectPaths = [];
  ignoredFilesCache = {};

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

  isIgnored(filePath) {
    if (this.ignoredFilesCache[filePath]) {
      return true;
    }

    for (const projectPath of this.projectPaths) {
      const relativePath = filePath.replace(`${projectPath}/`, '');
      const ignored = this.ig.ignores(relativePath);
      if (ignored) {
        this.ignoredFilesCache[filePath] = true;
        return true;
      }
    }

    const isAllowed = this.isAllowedFile(filePath);
    if (!isAllowed) {
      this.ignoredFilesCache[filePath] = true;
      return true;
    }

    return false;
  }

  isAllowedFile(filePath) {
    const extname = path.extname(filePath);
    if (!extname) {
      return true; // probably it is folder
    }

    const { extensions, configFiles } = Store.get(STORE_KEYS.allowedFiles);
    const basename = path.basename(filePath);

    const isAllowedConfigFile = configFiles.includes(basename);
    const isAllowedExtension = extensions.includes(extname);

    return isAllowedConfigFile || isAllowedExtension;
  }

  createFileHash(filePath) {
    const fileContent = this.readFileContent(filePath);
    return crypto
      .createHash(CRYPTO.algorithm)
      .update(fileContent)
      .digest(CRYPTO.hashEncode);
  }

  readFileContent(filePath) {
    return fs.readFileSync(filePath, { encoding: CRYPTO.fileEncode });
  }

  getLocalFolderName(folder) {
    const projectPath = this.projectPaths[0];
    if (!projectPath) {
      return folder;
    }

    return folder.replace(projectPath, '');
  }

  getLocalFileName(filePath) {
    return path.basename(filePath) || filePath;
  }
}

const FileUtilsInstance = new FileUtils();

export { FileUtilsInstance as FileUtils };
