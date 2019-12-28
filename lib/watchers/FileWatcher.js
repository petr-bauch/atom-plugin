'use babel';

import fs from 'fs';
import { isArray, isEmpty } from 'lodash';

import { Store } from '../modules/Store';
import { FileUtils } from '../modules/FileUtils';

import { STORE_KEYS } from '../constants/store';
import { FILE_ACTIONS } from '../constants/watchers';
import { FILE_STATUS, IGNORES } from '../constants/files';

class FileWatcher {

  fileWatcher = null;
  foldersToScan = [];
  projectFiles = {
    // [fullPath: string]: {
    //   hash: string,
    //   size: number,
    //   status: string (one of FILE_STATUS),
    // }
  };

  changedFiles = [];
  removedFiles = [];

  async activate() {
    if (this.fileWatcher) {
      this.fileWatcher.dispose();
      this.fileWatcher = null;
    }

    this.projectFiles = Store.get(STORE_KEYS.projectFiles);

    this.fileWatcher = atom.project.onDidChangeFiles(async events => {
      for (const event of events) {
        const { action, path, oldPath } = event;
        if (path.includes(IGNORES.git) || path.includes(IGNORES.idea)) {
          return;
        }

        if (action === FILE_ACTIONS.renamed) {
          this.addRemovedFile(oldPath);
          this.addChangedFile(path);

        } else if (action === FILE_ACTIONS.deleted) {
          this.addRemovedFile(path);

        } else {
          this.addChangedFile(path);
        }
      }
    });

    if (this.foldersToScan.length > 0) {
      await this.scanFolders();
    }
    console.log('FileWatcher is started successfully');
  }

  addChangedFile(path) {
    if (!this.changedFiles.includes(path)) {
      this.changedFiles.push(path);
    }
  }

  addRemovedFile(path) {
    if (!this.removedFiles.includes(path)) {
      this.removedFiles.push(path);
    }
  }

  addFolderToScan(folder) {
    if (!this.foldersToScan.includes(folder)) {
      this.foldersToScan.push(folder);
    }
  }

  getFileInfo(filePath) {
    const fileInfo = this.projectFiles[filePath];
    const isExisted = fs.existsSync(filePath);
    const isProcessed = Boolean(fileInfo);

    if (isProcessed && !isExisted) {
      fileInfo.status = FILE_STATUS.deleted;
      return fileInfo;
    }

    const fileHash = FileUtils.createFileHash(filePath);
    const fileSize = fs.lstatSync(filePath).size;
    if (!isProcessed) {
      return {
        hash: fileHash,
        size: fileSize,
        status: FILE_STATUS.created,
      };
    }

    fileInfo.status = (fileHash === fileInfo.hash)
      ? FILE_STATUS.same
      : FILE_STATUS.modified;

    fileInfo.hash = fileHash;

    return fileInfo;
  }

  getProjectFiles(paths = [], includeContent = false) {
    const filteredPaths = (Array.isArray(paths) && paths.length > 0)
      ? paths
      : Object.keys(this.projectFiles);

    return filteredPaths.reduce((res, path) => {
      const fileInfo = {
        path,
        ...this.projectFiles[path],
      };
      if (includeContent) {
        fileInfo.content = FileUtils.readFileContent(path);
      }

      res[path] = fileInfo;
      return res;
    }, {});
  }

  getState() {
    return {
      changedFiles: [...this.changedFiles],
      removedFiles: [...this.removedFiles],
    };
  }

  async buildBundle(changedFiles = []) {

    const sourceList = (isArray(changedFiles) && !isEmpty(changedFiles))
      ? changedFiles
      : this.changedFiles;

    const files = sourceList.reduce((res, path) => {
      const fileInfo = this.getFileInfo(path);

      this.projectFiles[path] = fileInfo;
      res[path] = fileInfo.hash;

      return res;
    }, {});

    const result = {
      files,
    };

    return Promise.resolve(result);
  }

  async synchronizeBundle(changedFiles = [], removedFiles = []) {
    this.changedFiles = this.changedFiles.filter(path => !changedFiles.includes(path));
    this.removedFiles = this.removedFiles.filter(path => !removedFiles.includes(path));

    return Promise.resolve();
  }

  async scanFolders() {
    Store.set(STORE_KEYS.scanningInProcess, true);
    this.changedFiles = [];
    this.removedFiles = [];

    console.log(`Scanning folders started. Root folders to scan: ${this.foldersToScan.length}`);
    this.foldersToScan.forEach(folder => {
      console.log(` - ${folder}`);
    });

    const queue = this.foldersToScan.map(async (folder) => {
      await this.scanFolder(folder);
    });

    await Promise.all(queue);
    Store.set(STORE_KEYS.scanningInProcess, false);
    Store.set(STORE_KEYS.projectFiles, this.projectFiles);

    console.log('Scanning finished');
    console.log('Changed files: ', this.changedFiles);
  }

  async scanFolder(folder) {

    const localName = FileUtils.getLocalFolderName(folder);
    Store.set(STORE_KEYS.scanningFolder, localName);

    const folderList = fs.readdirSync(folder);
    for (const filePath of folderList) {
      const fullPath = `${folder}/${filePath}`;
      const isIgnored = FileUtils.isIgnored(fullPath);
      if (isIgnored) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const isDir = fs.lstatSync(fullPath).isDirectory();
      if (isDir) {
        // eslint-disable-next-line no-await-in-loop
        await this.scanFolder(fullPath);

      } else {
        this.changedFiles.push(fullPath);
      }
    }

    return Promise.resolve();
  }

  destroy() {
    if (this.fileWatcher) {
      this.fileWatcher.dispose();
      this.fileWatcher = null;
    }
  }
}

const FileWatcherInstance = new FileWatcher();

export { FileWatcherInstance as FileWatcher };
