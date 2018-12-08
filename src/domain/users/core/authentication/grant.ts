import * as jwt from 'jsonwebtoken';
import {ObjectID, Collection} from 'mongodb';

import {IUser} from '../IUser';

export enum GrantType {
  implicit = 'implicit',
  resourceOwnerClientCredentials = 'password',
  refreshToken = 'refresh_token'
}

export interface IGrantResponse {
  tokenType: string,
  expiresIn: number,
  accessToken: string,
  refreshToken?: string,
  state: string,
}

export interface IAuthenticationGrant {
  type: string,
  clientId: string,
  scope: Object

  /**
   * Apply grant to a given resource.
   */
  apply () : Promise<IGrantResponse>;
}

export interface IAccessTokenData {
  _id: ObjectID, // user id
  scope: Object
}

export interface IRefreshToken {
  _id: ObjectID,
  userId: ObjectID
}

/**
 * Implicit grant type.
 *
 * @author Dragos Sebestin
 */
export class ImplicitGrant implements IAuthenticationGrant {
  public type: string = GrantType.implicit;
  public clientId: string = '';
  public scope: Object = {};

  /**
   * Class constructor.
   */
  constructor (
    clientId: string,
    private _clientSecret: string,
    private _accessTokenTtl: number,
    private _user: IUser,
    private _state: string
  ) {
    this.clientId = clientId;
  }

  async apply () : Promise<IGrantResponse> {
    let token: IAccessTokenData = { _id: this._user._id, scope: {} };
    let accessToken = jwt.sign(token, this._clientSecret, {
      expiresIn: this._accessTokenTtl,
      subject: this.clientId
    });

    return {
      tokenType: 'Bearer',
      expiresIn: this._accessTokenTtl,
      accessToken: accessToken,
      state: this._state
    };
  }
}

/**
 * Resource owner client credentials type grant.
 *
 * @author Dragos Sebestin
 */
export class ResourceOwnerClientCredentialsGrant implements IAuthenticationGrant {
  public type: string = GrantType.resourceOwnerClientCredentials;
  public clientId: string = '';
  public scope: Object = {};

  /**
   * Class constructor.
   */
  constructor (
    clientId: string,
    private _clientSecret: string,
    private _accessTokenTtl: number,
    private _user: IUser,
    private _tokenRepo: Collection<IRefreshToken>,
    private _state: string
  ) {
    this.clientId = clientId;
  }

  async apply () : Promise<IGrantResponse> {
    let tokenData: IAccessTokenData = { _id: this._user._id, scope: {} };
    let accessToken = jwt.sign(tokenData, this._clientSecret, {
      expiresIn: this._accessTokenTtl,
      subject: this.clientId
    });

    let refreshToken: IRefreshToken = {
      _id: new ObjectID(),
      userId: tokenData._id
    };

    await this._tokenRepo.insertOne(refreshToken);

    return {
      tokenType: 'Bearer',
      expiresIn: this._accessTokenTtl,
      accessToken: accessToken,
      refreshToken: refreshToken._id.toString(),
      state: this._state
    };
  }
}

/**
 * Refresh token grant type.
 *
 * @author Dragos Sebestin
 */
export class RefreshTokenGrant implements IAuthenticationGrant {
  public type: string = GrantType.refreshToken;
  public clientId: string = '';
  public scope: Object = {};

  /**
   * Class constructor.
   */
  constructor (
    private _clientId: string,
    private _clientSecret: string,
    private _accessTokenTtl: number,
    private _tokenRepo: Collection<IRefreshToken>,
    private _refreshTokenId: ObjectID,
    private _state: string,
  ) { }

  async apply () : Promise<IGrantResponse> {
    // check if this refresh token exists
    let refreshToken = await this._tokenRepo.findOne({_id: this._refreshTokenId});
    if (!refreshToken) {
      throw new Error(`Refresh token id ${this._refreshTokenId} not found.`);
    }

    // create a new refresh token
    let newRefreshToken: IRefreshToken = {
      _id: new ObjectID(),
      userId: refreshToken.userId
    };
    await this._tokenRepo.insertOne(newRefreshToken);

    // remove old token
    await this._tokenRepo.remove({_id: this._refreshTokenId});

    // generate new access token
    let tokenData: IAccessTokenData = {
      _id: refreshToken.userId,
      scope: this.scope
    };
    let accessToken = jwt.sign(tokenData, this._clientSecret, {
      expiresIn: this._accessTokenTtl,
      subject: this._clientId
    });

    return {
      tokenType: 'Bearer',
      expiresIn: this._accessTokenTtl,
      accessToken: accessToken,
      refreshToken: newRefreshToken._id.toString(),
      state: this._state
    };
  }
}
