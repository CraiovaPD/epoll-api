import * as express from 'express';
// import * as nconf from 'nconf';
// import * as multer from 'multer';
// import * as path from 'path';
import {ObjectID} from 'mongodb';
import {Schema} from 'inpt.js';

import {isAuthorized} from '../authorization';
import {transform} from '../transform';
// import {throttle} from '../throttle';
// import {RateLimiter} from '../../application/rateLimiter';
import {ServiceRegistry} from '../../application/serviceRegistry';
import {USER_SERVICE_COMPONENT, UserService} from '../../domain/users/service';
import { IApiClient } from '../../domain/users/core/authentication/IApiClient';

export function get (
  registry: ServiceRegistry,
  apiClients: IApiClient[]
) : express.Router {
  let router = express.Router();

  let users = registry.get(USER_SERVICE_COMPONENT) as UserService;

  router.post('/user/register', transform(new Schema({
    grantType: Schema.Types.String,
    clientId: Schema.Types.String,
    clientSecret: Schema.Types.Optional(Schema.Types.String),
    state: Schema.Types.String,

    accountKitCode: Schema.Types.String,
    firstname: Schema.Types.String,
    lastname: Schema.Types.Optional(Schema.Types.String)
  })), async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      let authentication = await users.register({
        grantType: req.body.grantType,
        clientId: req.body.clientId,
        clientSecret: req.body.clientSecret,
        state: req.body.state,

        accountKitCode: req.body.accountKitCode,
        firstname: req.body.firstname,
        lastname: req.body.lastname
      });
      res.json(authentication);
    } catch (err) {
      next(err);
    }
  });

  router.post('/user/oauth', transform(new Schema({
    grantType: Schema.Types.String,
    clientId: Schema.Types.String,
    clientSecret: Schema.Types.Optional(Schema.Types.String),
    state: Schema.Types.String,

    accountKitCode: Schema.Types.String
  })), async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      let authentication = await users.loginAK({
        grantType: req.body.grantType,
        clientId: req.body.clientId,
        clientSecret: req.body.clientSecret,
        state: req.body.state,

        accountKitCode: req.body.accountKitCode
      });
      res.json(authentication);
    } catch (err) {
      next(err);
    }
  });

  router.post('/user/oauth/refresh_token', transform(new Schema({
    clientId: Schema.Types.String,
    clientSecret: Schema.Types.Optional(Schema.Types.String),
    state: Schema.Types.String,

    refreshToken: Schema.Types.String
  })), async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      let authentication = await users.refreshAccessToken({
        clientId: req.body.clientId,
        clientSecret: req.body.clientSecret,
        state: req.body.state,

        oldRefreshToken: req.body.refreshToken
      });
      res.json(authentication);
    } catch (err) {
      next(err);
    }
  });

  /**
   * Method used for fetching own user profile.
   */
  router.get('/user/me', isAuthorized(apiClients), async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      let user = await users.findUserById((req as any).user._id);
      res.json(user);
    } catch (err) {
      next(err);
    }
  });

  /**
   * Method used for fetching a user profile by id.
   */
  router.get('/user/:id', isAuthorized(apiClients), async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      let user = await users.findUserById(
        new ObjectID(req.params.id)
      );
      res.json(user);
    } catch (err) {
      next(err);
    }
  });

  /**
   * Method used for removing a user account.
   */
  router.delete('/user', isAuthorized(apiClients), async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      await users.removeUserById(
        new ObjectID((req as any).user._id)
      );
      res.end();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
