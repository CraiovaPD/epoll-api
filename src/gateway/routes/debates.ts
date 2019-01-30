import * as express from 'express';
import * as multer from 'multer';
import * as path from 'path';
import {ObjectID} from 'mongodb';
import {Schema} from 'inpt.js';

import {isAuthorized} from '../authorization';
import {transform, transformQ} from '../transform';
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
import { IApiClient } from '../../domain/users/core/authentication/IApiClient';

export function get (
  registry: ServiceRegistry,
  apiClients: IApiClient[]
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
  let authorization = isAuthorized(apiClients);

  /**
   * Route used for creating a new poll.
   */
  router.post('/debate/poll', authorization, transform(new Schema({
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
        content: req.body.content,
        createdBy: (req as any).user._id
      }));
      req; res;
    } catch (err) {
      next(err);
    }
  });

  /**
   * Route used for listing polls.
   */
  router.get('/debate/poll', transformQ(new Schema({
    stateFrom: Schema.Types.Optional(Schema.Types.Number),
    stateTo: Schema.Types.Optional(Schema.Types.Number),
    limit: Schema.Types.Optional(Schema.Types.Number)
  })), async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      let state = undefined;
      if (req.query.stateFrom && req.query.stateTo) {
        state = {
          from: req.query.stateFrom,
          to: req.query.stateTo
        };
      }
      res.send(await debates.listPolls({
        state,
        limit: req.query.limit
      }));
    } catch (err) {
      next(err);
    }
  });

  /**
   * Route used for listing anouncements.
   */
  router.get('/debate/anouncement', transformQ(new Schema({
    stateFrom: Schema.Types.Optional(Schema.Types.Number),
    stateTo: Schema.Types.Optional(Schema.Types.Number),
    limit: Schema.Types.Optional(Schema.Types.Number)
  })), async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      let state = undefined;
      if (req.query.stateFrom && req.query.stateTo) {
        state = {
          from: req.query.stateFrom,
          to: req.query.stateTo
        };
      }
      res.send(await debates.listAnouncements({
        state,
        limit: req.query.limit
      }));
    } catch (err) {
      next(err);
    }
  });

  /**
   * Route used for fetching a debate by id.
   */
  router.get('/debate/:id', transform(new Schema({
    limit: Schema.Types.Optional(Schema.Types.Number)
  })), async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      res.send(await debates.getDebateById(
        new ObjectID(req.params.id)
      ));
    } catch (err) {
      next(err);
    }
  });

  /**
   * Route used for updating a debate by id.
   */
  router.put('/debate/:id', transform(new Schema({
    title: Schema.Types.String,
    content: Schema.Types.String
  })), async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      res.send(await debates.updateDebateById({
        debateId: new ObjectID(req.params.id),
        newTitle: req.body.title,
        newContent: req.body.content,
      }));
    } catch (err) {
      next(err);
    }
  });

  /**
   * Route used adding a new option to an existing poll.
   */
  router.post('/debate/poll/:id/option', authorization, transform(new Schema({
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
  router.delete('/debate/poll/:id/option/:optionId', authorization,
    transform(new Schema({
      reason: Schema.Types.String
    })),
  async (
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
  router.post('/debate/poll/:id/attachment',
    authorization,
    uploader.single('attachment'),
    transform(new Schema({
      reason: Schema.Types.String
    })),
  async (
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

  /**
   * Route used removing an attachment from an existing poll.
   */
  router.delete(
    '/debate/poll/:id/attachment/:attachmentId',
    authorization,
    transform(new Schema({
      reason: Schema.Types.String
    })),
    async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      try {
        await debates.removePollAttachment({
          pollId: new ObjectID(req.params.id),
          attachmentId: new ObjectID(req.params.attachmentId)
        });

        res.end();
      } catch (err) {
        next(err);
      }
    }
  );

  /**
   * Route used adding a new vote to an existing poll.
   */
  router.post(
    '/debate/poll/:id/vote',
    authorization,
    transform(new Schema({
      optionId: Schema.Types.String
    })),
    async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      try {
        res.send(await debates.addPollVote({
          pollId: new ObjectID(req.params.id),
          userId: new ObjectID((req as any).user._id),
          optionId: new ObjectID(req.body.optionId)
        }));
      } catch (err) {
        next(err);
      }
    }
  );

  /**
   * Route used for creating a new anouncement.
   */
  router.post('/debate/anouncement', authorization, transform(new Schema({
    title: Schema.Types.String,
    content: Schema.Types.String
  })), async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      res.send(await debates.createAnouncement({
        title: req.body.title,
        content: req.body.content,
        createdBy: (req as any).user._id
      }));
      req; res;
    } catch (err) {
      next(err);
    }
  });

  /**
   * Route used adding a new attachment to an existing anouncement.
   */
  router.post('/debate/anouncement/:id/attachment',
    authorization,
    uploader.single('attachment'),
    transform(new Schema({
      reason: Schema.Types.String
    })),
  async (
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

      res.send(await debates.addAnouncementAttachment({
        anouncementId: new ObjectID(req.params.id),
        file
      }));
    } catch (err) {
      next(err);
    }
  });

  /**
   * Route used removing an attachment from an existing anouncement.
   */
  router.delete(
    '/debate/anouncement/:id/attachment/:attachmentId',
    authorization,
    transform(new Schema({
      reason: Schema.Types.String
    })),
    async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      try {
        await debates.removeAnouncementAttachment({
          anouncementId: new ObjectID(req.params.id),
          attachmentId: new ObjectID(req.params.attachmentId)
        });

        res.end();
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}
