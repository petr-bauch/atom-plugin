'use babel';

import fs from 'fs';

import { Store } from '../modules/Store';
import { FileUtils } from '../modules/FileUtils';

import { STORE_KEYS } from '../constants/store';
import { FILE_ACTIONS } from '../constants/watchers';
import { FILE_STATUS, GIT_FILENAME } from '../constants/files';

class FileWatcher {

  fileWatcher = null;
  projectFiles = {};
  foldersToScan = [];

  async activate() {
    if (this.fileWatcher) {
      this.fileWatcher.dispose();
      this.fileWatcher = null;
    }

    this.projectFiles = Store.get(STORE_KEYS.projectFiles);

    this.fileWatcher = atom.project.onDidChangeFiles(async events => {
      for (const event of events) {
        const { action, path, oldPath } = event;
        if (path.includes(GIT_FILENAME)) {
          return;
        }

        if (action === FILE_ACTIONS.renamed) {
          const oldFileInfo = await this.getFileInfo(oldPath);
          this.projectFiles[oldPath] = oldFileInfo;
        }

        const fileInfo = await this.getFileInfo(path);
        this.projectFiles[path] = fileInfo;
      };

      Store.set(STORE_KEYS.projectFiles, this.projectFiles);
    });

    if (this.foldersToScan.length > 0) {
      await this.scanFolders();
    }
    console.log('FileWatcher is started successfully');
  }

  addFolderToScan(folder) {
    if (!this.foldersToScan.includes(folder)) {
      this.foldersToScan.push(folder);
    }
  }

  getChangedFilesCount() {
    return Object.values(this.projectFiles).reduce((count, fileInfo) => {
      if (fileInfo.status !== FILE_STATUS.same) {
        count++;
      }
      return count;
    }, 0);
  }

  async scanFolders() {
    Store.set(STORE_KEYS.scanningInProcess, true);

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
  }

  async scanFolder(folder) {
    console.log(`Start scanning: ${folder}`);
    Store.set(STORE_KEYS.scanningFolder, folder);

    const folderList = fs.readdirSync(folder);
    for (const filePath of folderList) {
      const fullPath = `${folder}/${filePath}`;
      const isIgnored = FileUtils.isIgnored(fullPath);
      if (isIgnored) {
        continue;
      }

      const isDir = fs.lstatSync(fullPath).isDirectory();
      if (isDir) {
        await this.scanFolder(fullPath);
      } else {
        const fileInfo = await this.getFileInfo(fullPath);
        this.projectFiles[fullPath] = fileInfo;
      }
    };

    console.log(`End scanning: ${folder}`);
    return Promise.resolve();
  }

  async getFileInfo(filePath) {
    const fileInfo = this.projectFiles[filePath];
    const isExisted = fs.existsSync(filePath);
    const isProcessed = Boolean(fileInfo);

    if (isProcessed && !isExisted) {
      fileInfo.status = FILE_STATUS.deleted;
      return fileInfo;
    }

    const fileHash = FileUtils.createFileHash(filePath);
    if (!isProcessed) {
      return {
        hash: fileHash,
        status: FILE_STATUS.created,
      };
    }

    fileInfo.status = (fileHash === fileInfo.hash)
      ? FILE_STATUS.same
      : FILE_STATUS.modified;

    return fileInfo;
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
