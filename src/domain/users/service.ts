import {ObjectID, Collection} from 'mongodb';
import {context} from 'exceptional.js';
import {USER_NAMESPACE} from 'epoll-errors';

import {IService} from '../../application/IService';

import {IUser as IUserInternal} from './core/IUser';
import { ILoginResponse } from '../../types/users/ILoginResponse';
import { Authenticator } from './core/authentication/authenticator';
import { IApiClient } from './core/authentication/IApiClient';
import { IRefreshToken, GrantType } from './core/authentication/grant';
import { FacebookAccountKitApi } from './core/accountKit';
import { IAccountKitToken } from './core/IAccountKitToken';
import { User } from './core/User';
import { IUser } from '../../types/users/IUser';

// types

export const USER_SERVICE_COMPONENT = 'epoll:users';
const EXCEPTIONAL = context(USER_NAMESPACE);

/**
 * User service class.
 *
 * @author Dragos Sebestin
 */
export class UserService implements IService {
  private _authenticator: Authenticator;

  public id = USER_SERVICE_COMPONENT;

  /**
   * Class constructor.
   */
  constructor (
    private _usersRepo: Collection<IUserInternal>,
    private _akClientId: string,
    private _akClientSecret: string,
    private _akTokenRepo: Collection<IAccountKitToken>,
    private _refreshTokenRepo: Collection<IRefreshToken>,

    apiClients: IApiClient[]
  ) {
    this._authenticator = new Authenticator(apiClients, _refreshTokenRepo);
    this._usersRepo; EXCEPTIONAL;
  }

  /**
   * IService interface methods.
   */

  /**
   * Authenticate a user account.
   */
  async authenticate (
    loginParams: {
      grantType: GrantType,
      clientId: string,
      clientSecret?: string,
      state: string,
      extraPayload?: string
    },
    user: IUserInternal
  ) : Promise<ILoginResponse> {
    let grantResponse = await this._authenticator.startSession({
      grantType: loginParams.grantType,
      clientId: loginParams.clientId,
      clientSecret: loginParams.clientSecret,
      user,
      state: loginParams.state,
      extraPayload: loginParams.extraPayload
    });

    return Object.assign({}, grantResponse, {
      timestamp: Date.now(),
      user: {
        _id: String(user._id),
        phone: user.phone,
        firstname: user.firstname,
        lastname: user.lastname
      }
    });
  }

  /**
   * Method used by the gateway to register a new client account.
   */
  async register (params: {
    grantType: GrantType,
    clientId: string,
    clientSecret?: string,
    state: string,

    accountKitCode: string,
    firstname: string,
    lastname?: string
  }) : Promise<ILoginResponse> {
    let ak = new FacebookAccountKitApi(
      this._akClientId, this._akClientSecret, this._akTokenRepo
    );

    await ak.login(params.accountKitCode);
    let akProfile = await ak.getProfile();

    let user = new User({
      _id: new ObjectID(),
      phone: akProfile.phone.number,
      firstname: params.firstname,
      lastname: params.lastname
    });

    // save user account to db
    await this._usersRepo.insert(user);

    return this.authenticate({
      grantType: params.grantType,
      clientId: params.clientId,
      clientSecret: params.clientSecret,

      state: params.state
    }, user);
  }

  /**
   * Login a user account using an Account Kit Code.
   */
  async loginAK (params: {
    grantType: GrantType,
    clientId: string,
    clientSecret?: string,
    state: string,

    accountKitCode: string
  }) : Promise<ILoginResponse> {
    let ak = new FacebookAccountKitApi(
      this._akClientId, this._akClientSecret, this._akTokenRepo
    );

    await ak.login(params.accountKitCode);
    let akProfile = await ak.getProfile();

    let found = await this._usersRepo.findOne({
      phone: akProfile.phone.number
    });
    if (!found) {
      throw EXCEPTIONAL.NotFoundException(10, {
        phone: akProfile.phone.number
      });
    }

    return this.authenticate({
      grantType: params.grantType,
      clientId: params.clientId,
      clientSecret: params.clientSecret,
      state: params.state
    }, found);
  }

  /**
   * Get a new refresh token and access token.
   */
  async refreshAccessToken (params: {
    clientId: string,
    clientSecret: string,
    oldRefreshToken: string,
    state: string
  }) : Promise<ILoginResponse> {
    let foundToken = await this._refreshTokenRepo.findOne({
      _id: new ObjectID(params.oldRefreshToken)
    });

    if (!foundToken) {
      throw EXCEPTIONAL.NotFoundException(3, {
        message: `Could not find refresh token ${params.oldRefreshToken}.`
      });
    }

    let user = await this._usersRepo.findOne({
      _id: foundToken.userId
    });
    if (!user) {
      throw EXCEPTIONAL.NotFoundException(3, {
        message: `Could not find user with id ${foundToken.userId}.`
      });
    }

    return this.authenticate({
      grantType: GrantType.refreshToken,
      clientId: params.clientId,
      clientSecret: params.clientSecret,
      state: params.state,
      extraPayload: params.oldRefreshToken
    }, user);
  }

  /**
   * Find a user by id.
   */
  async findUserById (_id: ObjectID) : Promise<IUser> {
    let found = await this._usersRepo.findOne({ _id });
    if (!found) {
      throw EXCEPTIONAL.NotFoundException(11, { id: _id });
    }
    return {
      _id: String(found._id),
      phone: found.phone,
      firstname: found.firstname,
      lastname: found.lastname
    };
  }

  /**
   * Remove a user account by id.
   */
  async removeUserById (id: ObjectID) : Promise<void> {
    await this._usersRepo.deleteOne({
      _id: id
    });
  }
}
