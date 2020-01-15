'use babel';

import fs from 'fs';
import queue from 'queue';
import { isArray, isEmpty } from 'lodash';

import { Store } from '../modules/Store';
import { FileUtils } from '../modules/FileUtils';
import { Logger } from '../modules/Logger';
import { CommonUtils } from '../modules/CommonUtils';

import { PLUGIN } from '../constants/common';
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

  lastScanUpdate = 0;

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
        const isIgnored = FileUtils.isIgnored(path);
        if (isIgnored) {
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
      Store.set(STORE_KEYS.scanningInProcess, true);
      await this.scanFolders();
    }
    Logger.log('FileWatcher is started successfully');
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

    const fileSize = fs.lstatSync(filePath).size;
    if (fileSize > PLUGIN.maxPayload) {
      return null;
    }

    const fileHash = FileUtils.createFileHash(filePath);
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

    Store.set(STORE_KEYS.composingInProcess, true);
    await CommonUtils.sleep(100);

    const sourceList = (isArray(changedFiles) && !isEmpty(changedFiles))
      ? changedFiles
      : this.changedFiles;

    const files = sourceList.reduce((res, path) => {
      const fileInfo = this.getFileInfo(path);
      if (fileInfo) {
        this.projectFiles[path] = fileInfo;
        res[path] = fileInfo.hash;
      }

      return res;
    }, {});

    const result = {
      files,
    };

    Store.set(STORE_KEYS.composingInProcess, false);

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

    await CommonUtils.sleep(1000);

    Logger.log(`Scanning folders started. Root folders to scan: ${this.foldersToScan.length}`);
    this.foldersToScan.forEach(folder => {
      Logger.log(` - ${folder}`);
    });

    const q = queue({
      results: [],
      concurrency: 10,
      autostart: true,
    });

    q.on('end', () => {
      Store.set(STORE_KEYS.scanningInProcess, false);
      Store.set(STORE_KEYS.projectFiles, this.projectFiles);

      Logger.log('Scanning finished');
      Logger.log('Changed files: ', this.changedFiles);
    });

    this.foldersToScan.forEach(folder => {
      q.push(async () => {
        await CommonUtils.sleep(100);
        await this.scanFolder(folder, q);
      });
    });
  }

  async scanFolder(folder, q) {

    const now = new Date();
    if (now - this.lastScanUpdate > 500) {
      const localName = FileUtils.getLocalFolderName(folder);
      Store.set(STORE_KEYS.scanningFolder, localName);
      this.lastScanUpdate = now;
    }

    FileUtils.updateIgnore(folder);

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
        // await this.scanFolder(fullPath);
        q.push(async () => {
          await this.scanFolder(fullPath, q);
        });

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
