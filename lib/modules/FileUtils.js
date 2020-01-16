'use babel';

/* eslint-disable no-shadow */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import ignore from 'ignore';
import { isEmpty } from 'lodash';

import { Store } from './Store';
import { STORE_KEYS } from '../constants/store';
import { EXCLUDED_NAMES, CRYPTO, IGNORES } from '../constants/files';
import { PLUGIN } from '../constants/common';

class FileUtils {

  projectPaths = [];
  ignoreFilters = new Map();

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

  getIgnoreContent(ignoreFile) {
    const result = [];
    try {
      const buffer = fs.readFileSync(ignoreFile);
      const lines = buffer.toString().split('\n').filter(line => !!line);
      result.push(...lines);

    } catch (err) {
      // nothing
    }

    return result;
  }

  initIgnore() {
    this.projectPaths.forEach(path => {

      const rootFilter = ignore();
      rootFilter.add(EXCLUDED_NAMES);

      const gitContent = this.getIgnoreContent(`${path}/.gitignore`);
      const dcContent = this.getIgnoreContent(`${path}/.dcignore`);

      rootFilter.add(gitContent);
      rootFilter.add(dcContent);

      this.ignoreFilters.set(path, rootFilter);
    });
  }

  updateIgnore(folderPath) {
    const isDir = fs.lstatSync(folderPath).isDirectory();
    if (!isDir) {
      return;
    }

    const gitContent = this.getIgnoreContent(`${folderPath}/.gitignore`);
    const dcContent = this.getIgnoreContent(`${folderPath}/.dcignore`);

    const rules = [...gitContent, ...dcContent];
    if (!isEmpty(rules)) {
      const localFilter = ignore();
      localFilter.add(rules);
      this.ignoreFilters.set(folderPath, localFilter);
    }
  }

  getUnconfirmedProjectFolders() {
    const confirmedFolders = Store.get(STORE_KEYS.confirmedFolders);
    return this.projectPaths.filter(projectFolder => !confirmedFolders.includes(projectFolder));
  }

  isIgnored(filePath) {
    if (filePath.includes(IGNORES.git) || filePath.includes(IGNORES.idea)) {
      return true;
    }

    // check ignore filters
    for (const entry of this.ignoreFilters.entries()) {
      const [folderPath, filter] = entry;
      if (!filePath.includes(folderPath)) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const relativePath = filePath.replace(`${folderPath}/`, '');

      let ignored = false;
      try {
        ignored = filter.ignores(relativePath);
      } catch (err) {
        // nothing
      }
      if (ignored) {
        return true;
      }
    }

    const isAllowed = this.isAllowedFile(filePath);
    if (!isAllowed) {
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

    if (!(isAllowedConfigFile || isAllowedExtension)) {
      return false;
    }

    // checking for file size
    const fileSize = fs.lstatSync(filePath).size;

    return (fileSize <= PLUGIN.maxPayload);
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

  isIgnoreFile(filePath) {
    const fileName = path.basename(filePath);
    const isGitIgnore = (fileName === IGNORES.gitIgnore);
    const isDCIgnore = (fileName === IGNORES.dcIgnore);

    return (isGitIgnore || isDCIgnore);
  }

  getDirname(filePath) {
    return path.dirname(filePath);
  }
}

const FileUtilsInstance = new FileUtils();

export { FileUtilsInstance as FileUtils };
