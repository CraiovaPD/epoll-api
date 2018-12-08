import { ObjectID, Collection } from 'mongodb';
import * as qs from 'qs';
import {context} from 'exceptional.js';
import {USER_NAMESPACE} from 'epoll-errors';

import { IAccountKitToken } from './IAccountKitToken';
let axios = require('axios');

const EXCEPTIONAL = context(USER_NAMESPACE);

const GRAPH_API_URL = 'https://graph.accountkit.com/v1.3';

export interface IAccountKitUserProfile {
  id: string,
  phone: {
    number: string
    'country_prefix': string,
    'national_number': string
  }
}

/**
 * Facebook Account Kit API wrapper.
 *
 * @author Dragos Sebestin
 */
export class FacebookAccountKitApi {
  private _accessToken: string = '';

  /**
   * Class constructor.
   */
  constructor (
    private _appId: string,
    private _appSecret: string,
    private _fbAccountKitTokenRepo: Collection<IAccountKitToken>,
  ) {}

  /**
   * Login with facebook and get an app
   * access token.
   */
  async login (code: string) {
    try {
      let found = await this._fbAccountKitTokenRepo.find({
        code
      }).toArray();
      if (found && found.length === 1) {
        this._accessToken = found[0].token;
        return;
      }

      let apiResp = await this._api('GET', '/access_token', {
        'grant_type': 'authorization_code',
        'code': code,
        'access_token': `AA|${this._appId}|${this._appSecret}`
      });
      this._accessToken = apiResp.data['access_token'];
      await this._fbAccountKitTokenRepo.insertOne({
        _id: new ObjectID(),
        code: code,
        token: this._accessToken,
        createdAt: new Date()
      });
    } catch (error) {
      throw EXCEPTIONAL.GenericException(0, {
        debug: `Could not login via AK.`
      });
    }
  }

  /**
   * Debug an user access token.
   */
  async getProfile () : Promise<IAccountKitUserProfile> {
    try {
      let apiResp = await this._api('GET', '/me', {
        'access_token': this._accessToken
      });
      let profile: IAccountKitUserProfile = {
        id: apiResp.data['id'],
        phone: {
          number: apiResp.data['phone'].number,
          'country_prefix': apiResp.data['phone']['country_prefix'],
          'national_number': apiResp.data['phone']['national_number']
        }
      };
      return profile;
    } catch (err) {
      throw EXCEPTIONAL.GenericException(0, err);
    }
  }

  /**
   * Make an call to the API.
   */
  private async _api (method: string, endpoint: string, params: Object) {
    try {
      return axios({
        method,
        baseURL: GRAPH_API_URL,
        url: endpoint,
        params,
        paramsSerializer: function (params: Object) {
          return qs.stringify(params, {arrayFormat: 'brackets', encode: false});
        }
      });
    } catch (error) {
      throw EXCEPTIONAL.GenericException(1, {
        message: error.data.error.message
      });
    }
  }
}
