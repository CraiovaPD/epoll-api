import * as fs from 'fs';

/**
 * Interface to a file store class that can upload files
 * and return a URL to retrieve them.
 *
 * @author Dragos Sebestin
 */
export interface IFileStore {

  /**
   * Upload a file and return it's URL.
   *
   * @return string - file URL
   */
  upload (fileName: string, content: fs.ReadStream) : Promise<string>;

  /**
   * Remove file from storage.
   */
  remove (fileName: string) : Promise<void>;
}
