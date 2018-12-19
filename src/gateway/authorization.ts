import * as express from 'express';
import * as jwt from 'jsonwebtoken';
import {context} from 'exceptional.js';
import {USER_NAMESPACE} from 'epoll-errors';

import { IApiClient } from '../domain/users/core/authentication/IApiClient';
import { ObjectID } from 'bson';

const EXCEPTIONAL = context(USER_NAMESPACE);

/**
 * Middleware used to check if a user is authorized to access a route (via JWT).
 */
export function isAuthorized (apiClients: IApiClient[]) {
  return function (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    res;
    let authorizationHeader = req.headers['Authorization'] || req.headers['authorization'];
    if (typeof authorizationHeader === 'string') {
      let token = authorizationHeader as string;
      if (!token) {
        return next(EXCEPTIONAL.UnauthorizedException(4, {}));
      }

      token = token.substr('Bearer '.length);
      let decoded = jwt.decode(token) as any;
      if (!decoded) {
        return next(EXCEPTIONAL.UnauthorizedException(0, {}));
      }

      let client = apiClients.find(
        c => c.id === decoded.sub
      );
      if (!client) {
        return next(EXCEPTIONAL.UnauthorizedException(4, {}));
      }

      jwt.verify(token, client.secret, (err, decodedToken) => {
        if (err) {
          return next(EXCEPTIONAL.UnauthorizedException(4, {}));
        } else {
          Object.defineProperty(req, 'user', {
            value: {
              _id: new ObjectID((decodedToken as any)._id)
            }
          });
          next();
        }
      });
    } else {
      return next(EXCEPTIONAL.UnauthorizedException(4, {}));
    }
  };
}
