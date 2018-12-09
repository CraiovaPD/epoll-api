import { Collection, ObjectID } from 'mongodb';
import {context} from 'exceptional.js';
import {DEBATE_NAMESPACE} from 'epoll-errors';

import {IService} from '../../application/IService';
import {
  IDebate as IDebateInternal,
  IPollDebate as IPollDebateInternal
} from './core/IDebate';
import { Debate } from './core/debate';

// utils
import * as StringUtil from '../../util/helpers/string';

// types
import {
  IDebate, IPollDebate, DebateType,
  DebateState, IDebatePollListItem
} from '../../types/debates/IDebate';

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
    content: string
  }) : Promise<IDebate<IPollDebate>> {
    let newPoll = new Debate<IPollDebateInternal>({
      _id: new ObjectID(),
      createdAt: new Date(),
      type: DebateType.poll,
      state: DebateState.draft,
      payload: {
        title: StringUtil.capitalize(
          String(params.title).trim().toLowerCase()
        ),
        content: String(params.content).trim(),
        attachements: [],
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
      type: newPoll.type,
      state: newPoll.state,
      payload: {
        title: newPoll.payload.title,
        content: newPoll.payload.content,
        attachements: newPoll.payload.attachements.map(
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
    limit?: number
  }) : Promise<IDebatePollListItem[]> {
    let q = this._debatesCollection.find({
      type: DebateType.poll,
      state: DebateState.published
    }, {
      projection: {
        createdAt: 1,
        type: 1,
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
        payload: {
          title: doc.payload.title,
          votes: {
            count: doc.payload.votes.count
          }
        }
      };
    }).toArray();
  }
}
