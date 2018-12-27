import { Collection, ObjectID } from 'mongodb';
import {context} from 'exceptional.js';
import {DEBATE_NAMESPACE} from 'epoll-errors';

import {IService} from '../../application/IService';
import {
  IDebate as IDebateInternal,
  IPollDebate as IPollDebateInternal
} from './core/IDebate';
import { Debate } from './core/debate';
import { PollDebate } from './core/pollDebate';
import { IAttachment as IAttachmentInternal } from './core/IAttachment';
import { IVote as IVoteInternal } from './core/IVote';

// utils
import * as StringUtil from '../../util/helpers/string';

// types
import {
  IDebate, IPollDebate, DebateType,
  DebateState, IDebatePollListItem
} from '../../types/debates/IDebate';
import { IAttachment } from '../../types/debates/IAttachment';
import { IFile } from '../storage/core/IFile';
import { IVote } from '../../types/debates/IVote';

export const DEBATE_SERVICE_COMPONENT = 'epoll:debate';
const EXCEPTIONAL = context(DEBATE_NAMESPACE);

/**
 * Debate service class.
 *
 * @author Dragos Sebestin
 */
export class DebateService implements IService {
  public id = DEBATE_SERVICE_COMPONENT;

  /**
   * Class constructor.
   */
  constructor (
    private _debatesCollection: Collection<IDebateInternal<any>>
  ) {
    EXCEPTIONAL;
  }

  /**
   * IService interface methods.
   */

  /**
   * Create a new poll.
   */
  async createPoll (params: {
    title: string,
    content: string,
    createdBy: ObjectID
  }) : Promise<IDebate<IPollDebate>> {
    let newPoll = new Debate<IPollDebateInternal>({
      _id: new ObjectID(),
      createdAt: new Date(),
      createdBy: params.createdBy,
      type: DebateType.poll,
      state: DebateState.draft,
      title: StringUtil.capitalize(
        String(params.title).trim().toLowerCase()
      ),
      content: String(params.content).trim(),
      payload: {
        attachments: [],
        options: [],
        votes: {
          count: 0,
          data: []
        }
      }
    });

    await this._debatesCollection.insertOne(newPoll);

    return {
      _id: String(newPoll._id),
      createdAt: newPoll.createdAt,
      createdBy: String(newPoll.createdBy),
      type: newPoll.type,
      state: newPoll.state,
      title: newPoll.title,
      content: newPoll.content,
      payload: {
        attachments: newPoll.payload.attachments.map(
          (att: any) => {
            return att;
          }
        ),
        options: newPoll.payload.options.map(
          (opt: any) => {
            return {
              _id: String(opt._id),
              reason: opt.reason
            };
          }
        ),
        votes: {
          count: 0,
          data: []
        }
      }
    };
  }

  /**
   * List polls.
   */
  listPolls (params: {
    state?: {
      from: DebateState,
      to: DebateState
    },
    limit?: number
  }) : Promise<IDebatePollListItem[]> {
    let filters: any = {
      type: DebateType.poll
    };
    if (params.state) {
      filters.state = {
        $gte: params.state.from,
        $lte: params.state.to
      };
    }
    let q = this._debatesCollection.find(filters, {
      projection: {
        createdAt: 1,
        type: 1,
        state: 1,
        'payload.title': 1,
        'payload.votes.count': 1
      },
      limit: params.limit,
      sort: {
        _id: -1
      }
    });

    return q.map(doc => {
      return {
        _id: String(doc._id),
        createdAt: doc.createdAt,
        type: doc.type,
        state: doc.state,
        title: doc.title,
        payload: {
          title: doc.payload.title,
          votes: {
            count: doc.payload.votes.count
          }
        }
      };
    }).toArray();
  }

  /**
   * Fetch a debate by id.
   * @param params
   */
  async getDebateById (id: ObjectID) : Promise<IDebate<any>> {
    let found = await this._findDebateById(id);
    return this._projectDebate(found);
  }
  /**
   * Add poll option.
   */
  async addPollOption (params: {
    pollId: ObjectID,
    newOptionReason: string
  }) : Promise<{
    _id: string,
    reason: string
  }> {
    let newOption = {
      _id: new ObjectID(),
      reason: String(params.newOptionReason).trim()
    };

    let poll = new PollDebate(await this._findDebateById(
      params.pollId
    ));
    poll.addOption(newOption);

    await this._debatesCollection.updateOne({
      _id: poll._id
    }, {
      $set: {
        'payload.options': poll.payload.options
      }
    });

    return {
      _id: String(newOption._id),
      reason: newOption.reason
    };
  }

  /**
   * Remove a poll option.
   */
  async removePollOption (params: {
    pollId: ObjectID,
    optionId: ObjectID
  }) : Promise<void> {
    let poll = new PollDebate(await this._findDebateById(
      params.pollId
    ));
    poll.removeOption(params.optionId);

    await this._debatesCollection.updateOne({
      _id: poll._id
    }, {
      $set: {
        'payload.options': poll.payload.options
      }
    });
  }

  /**
   * Add a new attachment to a poll.
   */
  async addPollAttachment (params: {
    pollId: ObjectID
    file: IFile
  }) : Promise<IAttachment> {
    let newAttachment: IAttachmentInternal = {
      _id: new ObjectID(),
      file: params.file
    };

    let poll = new PollDebate(await this._findDebateById(
      params.pollId
    ));
    poll.addAttachment(newAttachment);

    await this._debatesCollection.updateOne({
      _id: poll._id
    }, {
      $set: {
        'payload.attachments': poll.payload.attachments
      }
    });

    return {
      _id: String(newAttachment._id),
      file: newAttachment.file
    };
  }

  /**
   * Add a new attachment to a poll.
   */
  async removePollAttachment (params: {
    pollId: ObjectID
    attachmentId: ObjectID
  }) : Promise<void> {
    let poll = new PollDebate(await this._findDebateById(
      params.pollId
    ));
    poll.removeAttachment(params.attachmentId);

    await this._debatesCollection.updateOne({
      _id: poll._id
    }, {
      $set: {
        'payload.attachments': poll.payload.attachments
      }
    });
  }

  /**
   * Add new pole vote.
   */
  async addPollVote (params: {
    pollId: ObjectID,
    userId: ObjectID,
    optionId: ObjectID,
  }) : Promise<IVote> {
    let newVote: IVoteInternal = {
      _id: new ObjectID(),
      createdAt: new Date(),
      userId: params.userId,
      optionId: params.optionId
    };

    let poll = new PollDebate(await this._findDebateById(
      params.pollId
    ));
    poll.addVote(newVote);

    await this._debatesCollection.updateOne({
      _id: poll._id
    }, {
      $set: {
        'payload.votes': poll.payload.votes
      }
    });

    return {
      _id: String(newVote._id),
      createdAt: newVote.createdAt,
      userId: String(newVote.userId),
      optionId: String(newVote.optionId)
    };
  }

  /**
   * Update a debate by id.
   */
  async updateDebateById (params: {
    debateId: ObjectID,
    newTitle: string,
    newContent: string
  }) : Promise<IDebate<any>> {
    let found = new Debate(await this._findDebateById(params.debateId));

    found.title = StringUtil.capitalize(
      String(params.newTitle).trim().toLowerCase()
    );
    found.content = String(params.newContent).trim();

    await this._debatesCollection.updateOne({
      _id: found._id
    }, {
      $set: {
        title: found.title,
        content: found.content
      }
    });

    return this._projectDebate(found);
  }

  /**
   * Find a debate by id.
   */
  private async _findDebateById (_id: ObjectID) : Promise<IDebateInternal<any>> {
    let found = await this._debatesCollection.findOne({
      _id
    });

    if (!found) {
      throw EXCEPTIONAL.NotFoundException(10, {
        debateId: _id
      });
    }

    return found;
  }

  /**
   * Project a debate to it's external representation.
   */
  private _projectDebate (debate: IDebateInternal<any>) : IDebate<any> {
    return {
      _id: String(debate._id),
      createdAt: debate.createdAt,
      createdBy: String(debate.createdBy),
      type: debate.type,
      state: debate.state,
      title: debate.title,
      content: debate.content,
      payload: debate.payload
    };
  }
}
