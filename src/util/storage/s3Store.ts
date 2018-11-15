import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as mime from 'mime-types';

import {IFileStore} from './IFileStore';

/**
 * File store implemendation that that uses AWS S3 as backend.
 *
 * @author Dragos Sebestin
 * @author Liviu Dima
 */
export class S3Store implements IFileStore {
  private _s3: AWS.S3;

  /**
   * Class constructor.
   */
  constructor (
    private _storagePath: string,
    awsKeyId: string,
    awsKeySecret: string,
    private _bucketName: string
  ) {
    let credentials = new AWS.Credentials(awsKeyId, awsKeySecret);

    this._s3 = new AWS.S3({
      credentials: credentials,
      region: 'eu-central-1'
    });
  }

  /** IFileStore interface methods. */

  /**
   * Upload file to s3 bucket
   * @param fileName
   * @param content
   */
  upload (fileName: string, content: fs.ReadStream) : Promise<string> {
    return new Promise<string>((resolve, reject) => {
      let fileUrl = this._storagePath + this._bucketName + '/' + fileName;

      let mimeType = mime.lookup(fileName);
      let contentType = mimeType ? mimeType : undefined;
      this._s3.upload({
        Bucket: this._bucketName,
        Key: fileName,
        Body: content,
        ACL: 'public-read',
        CacheControl: 'max-age=3153600000',
        ContentType: contentType
      }, (err) => {
        if (err)
          return reject(err);

        resolve(fileUrl);
      });
    });
  }

  /**
   * Remove item from bucket bt filename
   * @param fileName
   */
  remove (fileName: string) : Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._s3.deleteObject({
        Bucket: this._bucketName,
        Key: fileName
      }, (err) => {
        if (err)
          return reject(err);

        resolve();
      });
    });
  }
}
