import {Db} from 'mongodb';

import {UserService} from './service';
import { IApiClient } from './core/authentication/IApiClient';

export function get (
  usersDb: Db,
  akClientId: string,
  akClientSecret: string,
  apiClients: IApiClient[]
) : UserService {

  let usersCollection = usersDb.collection('users');
  let refreshTokensCollection = usersDb.collection('refresh-tokens');
  let akTokensCollection = usersDb.collection('account-kit-tokens');

  let service = new UserService(
    usersCollection, akClientId, akClientSecret,
    akTokensCollection, refreshTokensCollection, apiClients
  );

  return service;
}
