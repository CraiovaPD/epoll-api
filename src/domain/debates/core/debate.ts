import { ObjectID } from 'mongodb';
import {context} from 'exceptional.js';
import {DEBATE_NAMESPACE} from 'epoll-errors';

import { IDebate } from './IDebate';
import { DebateType, DebateState } from '../../../types/debates/IDebate';

const EXCEPTIONAL = context(DEBATE_NAMESPACE);

/**
 * Class used for managing debate objects.
 */
export class Debate<T> implements IDebate<T> {
  public _id: ObjectID;
  public createdAt: Date;
  public createdBy: ObjectID;
  public type: DebateType;
  public state: DebateState;

  public title: string;
  public content: string;
  public payload: T;

  /**
   * Class constructor.
   */
  constructor (
    data: IDebate<T>
  ) {
    this._id = data._id;
    this.createdAt = data.createdAt;
    this.createdBy = data.createdBy;
    this.type = data.type;
    this.state = data.state;
    this.title = data.title;
    this.content = data.content;
    this.payload = data.payload;
  }

  /**
   * Change debate state.
   */
  changeState (newState: DebateState) {
    if (newState === DebateState.draft) {
      throw EXCEPTIONAL.DomainException(13, {});
    }

    this.state = newState;
  }
}
