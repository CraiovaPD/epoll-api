// import {Db} from 'mongodb';

import {StorageService} from './service';
import { IFileStore } from '../../util/storage/IFileStore';

export function get (
  hostname: string,
  fileStore: IFileStore
) : StorageService {

  let service = new StorageService(
    hostname, fileStore
  );

  return service;
}
