import * as express from 'express';
import * as multer from 'multer';
import * as path from 'path';
import {ObjectID} from 'mongodb';
import {Schema} from 'inpt.js';

// import {isAuthorized} from '../authorization';
import {transform} from '../transform';
// import {throttle} from '../throttle';
// import {RateLimiter} from '../../application/rateLimiter';
import {ServiceRegistry} from '../../application/serviceRegistry';
import {
  DEBATE_SERVICE_COMPONENT, DebateService
} from '../../domain/debates/service';
import {
  STORAGE_SERVICE_COMPONENT, StorageService
} from '../../domain/storage/service';
import { IFile } from '../../domain/storage/core/IFile';

export function get (
  registry: ServiceRegistry
) : express.Router {
  let router = express.Router();

  // init multer
  let multerStorage = multer.diskStorage({
    filename: (req, file, cb) => {
      req;
      let fileName = path.parse(file.originalname);
      let resultName = `${fileName.name}-${Date.now()}${fileName.ext}`;
      cb(null, resultName);
    }
  });
  let uploader = multer({storage: multerStorage});

  let debates = registry.get(DEBATE_SERVICE_COMPONENT) as DebateService;
  let storage = registry.get(STORAGE_SERVICE_COMPONENT) as StorageService;

  /**
   * Route used for creating a new poll.
   */
  router.post('/debate/poll', transform(new Schema({
    title: Schema.Types.String,
    content: Schema.Types.String
  })), async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      res.send(await debates.createPoll({
        title: req.body.title,
        content: req.body.content
      }));
      req; res;
    } catch (err) {
      next(err);
    }
  });

  /**
   * Route used for listing polls.
   */
  router.get('/debate/poll', transform(new Schema({
    limit: Schema.Types.Optional(Schema.Types.Number)
  })), async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      res.send(await debates.listPolls({
        limit: req.body.limit
      }));
    } catch (err) {
      next(err);
    }
  });

  /**
   * Route used adding a new option to an existing poll.
   */
  router.post('/debate/poll/:id/option', transform(new Schema({
    reason: Schema.Types.String
  })), async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      res.send(await debates.addPollOption({
        pollId: new ObjectID(req.params.id),
        newOptionReason: req.body.reason
      }));
    } catch (err) {
      next(err);
    }
  });

  /**
   * Route used removing an option from an existing poll.
   */
  router.delete('/debate/poll/:id/option/:optionId', transform(new Schema({
    reason: Schema.Types.String
  })), async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      res.send(await debates.removePollOption({
        pollId: new ObjectID(req.params.id),
        optionId: new ObjectID(req.params.optionId)
      }));
    } catch (err) {
      next(err);
    }
  });

  /**
   * Route used adding a new attachment to an existing poll.
   */
  router.post('/debate/poll/:id/attachment', uploader.single('attachment'),
  transform(new Schema({
    reason: Schema.Types.String
  })), async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    let file: IFile | undefined;
    try {
      file = await storage.createFileFromPath({
        fileName: req.file.filename,
        size: req.file.size,
        mimeType: req.file.mimetype,
        filePath: req.file.path,
        originalName: req.file.originalname
      });

      res.send(await debates.addPollAttachment({
        pollId: new ObjectID(req.params.id),
        file
      }));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
