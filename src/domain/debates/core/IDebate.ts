import { ObjectID } from 'mongodb';

// types
import { DebateType, DebateState } from '../../../types/debates/IDebate';
import { IVote } from './IVote';
import { IAttachment } from './IAttachment';

/**
 * General debate interface.
 *
 * @author Dragos Sebestin
 */
export interface IDebate<T> {
  _id: ObjectID,
  createdAt: Date,
  createdBy: ObjectID,
  type: DebateType,
  state: DebateState,
  title: string,
  content: string,
  payload: T
}

// debate payload types
export interface IPollDebate {
  attachments: IAttachment[],
  options: Array<{
    _id: ObjectID,
    reason: string
  }>,
  votes: {
    count: number,
    data: IVote[]
  }
}

export interface IAnoucementDebate {
  attachments: IAttachment[]
}
