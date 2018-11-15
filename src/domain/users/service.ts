import {ObjectID} from 'mongodb';
import {context} from 'exceptional.js';
import {USER_NAMESPACE} from 'epoll-errors';

import {IService} from '../../application/IService';
import {IRepository} from '../../util/storage/IRepository';

import {IUser as IUserInternal} from './core/IUser';

// types

export const USER_SERVICE_COMPONENT = 'epoll:users';
const EXCEPTIONAL = context(USER_NAMESPACE);

/**
 * User service class.
 *
 * @author Dragos Sebestin
 */
export class UserService implements IService {
  public id = USER_SERVICE_COMPONENT;

  /**
   * Class constructor.
   */
  constructor (
    private _usersRepo: IRepository<IUserInternal, ObjectID>,
  ) {
    this._usersRepo; EXCEPTIONAL;
  }

  /**
   * IService interface methods.
   */
}
