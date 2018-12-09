import { ObjectID } from 'mongodb';

import { IFile } from '../../storage/core/IFile';

/**
 * File attachement interface.
 *
 * @author Dragos Sebestin
 */
export interface IAttachment {
  _id: ObjectID,
  file: IFile
}
