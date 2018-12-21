import { ObjectID } from 'mongodb';

// types
import { DebateType, DebateState } from '../../../types/debates/IDebate';
import { IVote } from './IVote';

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
  payload: T
}

// debate payload types
export interface IPollDebate {
  title: string,
  content: string,
  attachments: any[],
  options: Array<{
    _id: ObjectID,
    reason: string
  }>,
  votes: {
    count: number,
    data: IVote[]
  }
}
