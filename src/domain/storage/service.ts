// import {ObjectID, Collection} from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';
import {context} from 'exceptional.js';
import {STORAGE_NAMESPACE} from 'epoll-errors';

import {IService} from '../../application/IService';

// utils
import {IFileStore} from '../../util/storage/IFileStore';

// types
import { IFile } from './core/IFile';

export const STORAGE_SERVICE_COMPONENT = 'epoll:storage';
const EXCEPTIONAL = context(STORAGE_NAMESPACE);

/**
 * Storage service class.
 *
 * @author Dragos Sebestin
 */
export class StorageService implements IService {
  public id = STORAGE_SERVICE_COMPONENT;

  /**
   * Class constructor.
   */
  constructor (
    private _storagePath: string,
    private _fileStore: IFileStore
  ) {
    EXCEPTIONAL;
  }

  /**
   * IService interface methods.
   */

  /**
   * Method used for uploading a file to the store
   * and retrieving it's info.
   */
  async createFileFromPath (params: {
    fileName: string,
    size: number,
    mimeType: string,
    filePath: string,
    originalName: string
  }) : Promise<IFile> {
    let content = fs.createReadStream(params.filePath);
    let downloadPath = await this._fileStore.upload(
      params.fileName, content
    );

    let originalFile = path.parse(params.filePath);

    return {
      name: params.fileName,
      size: params.size,
      extension: originalFile.ext,
      mimeType: params.mimeType,
      internalPath: path.join(this._storagePath, params.fileName),
      downloadPath,
      originalName: params.originalName
    };
  }

}
