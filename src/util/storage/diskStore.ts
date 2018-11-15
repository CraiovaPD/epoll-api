import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';

import {IFileStore} from './IFileStore';

/**
 * File store implemendation that stores files on disk.
 * Make sure to server that folder in express to be able
 * to access the files by URL.
 *
 * @author Dragos Sebestin
 * @author Liviu Dima
 */
export class DiskStore implements IFileStore {

  /**
   * Class constructor.
   */
  constructor (
    private _storagePath: string,
    private _hostname: string
  ) {
    if (!fs.existsSync(this._storagePath)) {
      this.ensurePath(this._storagePath);
    }
  }

  /**
   * IFileStore interface methods.
   */
  upload (fileName: string, content: fs.ReadStream) : Promise<string> {
    return new Promise<string>((resolve, reject) => {
      let filePath = path.join(this._storagePath, fileName);

      this.ensureFilePath(filePath);

      let wStream = fs.createWriteStream(filePath);

      content.on('end', () => {
        resolve(url.resolve(this._hostname, fileName));
      });
      content.on('error', (err) => {
        reject(err);
      });
      content.pipe(wStream);
    });
  }

  remove (fileName: string) : Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let filePath = path.join(this._storagePath, fileName);
      fs.unlink(filePath, (err) => {
        if (err)
          return reject(err);

        resolve();
      });
    });
  }

  /**
   * Make sure the path to the file exists.
   */
  private ensureFilePath (filePath: string) {
    let p = path.parse(filePath);
    this.ensurePath(p.dir);
  }

  /**
   * Make sure a given path exists.
   * If folders are missing it will create them.
   */
  private ensurePath(storagePath: string) {
    let sep = path.sep;
    if (!storagePath.includes(sep))
      sep = '/'
       ;
    storagePath.split(sep).splice(1).reduce((parentDir, childDir) => {
      const curDir = path.join(parentDir, childDir);
      if (!fs.existsSync(curDir)) {
        fs.mkdirSync(curDir);
      }

      return curDir;
    }, path.parse(storagePath).root);
  }
}
