import { ObjectID } from 'mongodb';

// util
import * as StringUtil from '../../../util/helpers/string';

// types
import { IUser } from './IUser';
import { UserRole } from '../../../types/users/IUser';

/**
 * Class used for working with user objects.
 *
 * @author Dragos Sebestin
 */
export class User implements IUser {
  public _id: ObjectID;
  public phone: string;
  public role: UserRole;
  public firstname: string;
  public lastname?: string;

  /**
   * Class constructor.
   */
  constructor (data: IUser) {
    this._id = data._id;
    this.phone = String(data.phone).trim();
    this.role = data.role;
    this.firstname =
      StringUtil.capitalize(
        String(data.firstname).trim().toLowerCase()
      );
    this.lastname =
      StringUtil.capitalize(
        String(data.lastname).trim().toLowerCase()
      );
  }
}
