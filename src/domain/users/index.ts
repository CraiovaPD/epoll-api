import {Db} from 'mongodb';

import * as MongoHelper from '../../util/helpers/mongo';
import {MongoRepository} from '../../util/storage/mongoRepository';
import {UserService} from './service';
import { IUser } from './core/IUser';

export function get (
  usersDb: Db
) : UserService {

  let usersCollection = usersDb.collection('users');
  MongoHelper.ensureIndex(usersCollection, 'phone', true);
  let usersRepo = new MongoRepository<IUser>(usersCollection);

  let service = new UserService(
    usersRepo
  );

  return service;
}
