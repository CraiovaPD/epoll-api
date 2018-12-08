import {ObjectID, Collection} from 'mongodb';
import {context} from 'exceptional.js';
import {USER_NAMESPACE} from 'epoll-errors';

import {IApiClient} from './IApiClient';

import {
  GrantType,
  IAuthenticationGrant,
  IGrantResponse,
  IRefreshToken,
  ImplicitGrant,
  ResourceOwnerClientCredentialsGrant,
  RefreshTokenGrant
} from './grant';

import {IUser} from '../IUser';

const EXCEPTIONAL = context(USER_NAMESPACE);

export interface IAuthenticationRequest {
  grantType: GrantType,
  state: string,
  clientId: string,
  clientSecret?: string,
  user: IUser,
  extraPayload?: string
}

/**
 * Class used for creating session objects.
 *
 * @author Dragos Sebestin
 */
export class Authenticator {

  /**
   * Class constructor.
   */
  constructor (
    private _apiClients: IApiClient[],
    private _refreshTokenRepo: Collection<IRefreshToken>
  ) {}

  /**
   * Create a new session itentifier.
   */
  async startSession (request: IAuthenticationRequest) : Promise<IGrantResponse> {
    let grant = this._getGrant(request);
    if (!grant) {
      throw EXCEPTIONAL.InputValidationException(0, {
        message: 'Unkown grant type provided.'
      });
    }

    return await grant.apply();
  }

  /**
   * Instantiate a grant type.
   */
  private _getGrant (request: IAuthenticationRequest) : IAuthenticationGrant | null {
    // find api client
    let client = this._apiClients.find(
      c => c.id === request.clientId
    );

    if (!client) {
      throw EXCEPTIONAL.NotFoundException(0, {});
    }

    if (request.grantType === GrantType.implicit) {
      return new ImplicitGrant(
        client.id, client.secret,
        60 * 60 * 24 * 30 * 6,
        request.user, request.state
      ); // six months expire time
    } else if (request.grantType === GrantType.resourceOwnerClientCredentials) {
      if (!request.clientSecret) {
        throw EXCEPTIONAL.InputValidationException(3, {
          message: 'Secret missing.'
        });
      }

      return new ResourceOwnerClientCredentialsGrant(
        client.id, request.clientSecret,
        60 * 60 * 24,
        request.user, this._refreshTokenRepo, request.state
      ); // 24h expire time
    } else if (request.grantType === GrantType.refreshToken) {
      if (!request.clientSecret) {
        throw EXCEPTIONAL.InputValidationException(3, {
          message: 'client secret missing.'
        });
      }
      return new RefreshTokenGrant(
        client.id, request.clientSecret,
        60 * 60 * 24,
        this._refreshTokenRepo,
        new ObjectID(request.extraPayload),
        request.state
      );
    }

    return null;
  }
}
