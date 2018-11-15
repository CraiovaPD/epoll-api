import * as express from 'express';
// import * as nconf from 'nconf';
// import * as multer from 'multer';
// import * as path from 'path';
// import {ObjectID} from 'mongodb';
// import {Schema} from 'inpt.js';

// import {isAuthorized} from '../authorization';
// import {transform, transformQ} from '../transform';
// import {throttle} from '../throttle';
// import {RateLimiter} from '../../application/rateLimiter';
import {ServiceRegistry} from '../../application/serviceRegistry';
import {USER_SERVICE_COMPONENT, UserService} from '../../domain/users/service';

export function get (
  registry: ServiceRegistry
) : express.Router {
  let router = express.Router();

  let users = registry.get(USER_SERVICE_COMPONENT) as UserService;
  users;

  return router;
}
