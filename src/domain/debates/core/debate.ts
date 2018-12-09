import { ObjectID } from 'mongodb';

import { IDebate } from './IDebate';
import { DebateType, DebateState } from '../../../types/debates/IDebate';

/**
 * Class used for managing debate objects.
 */
export class Debate<T> implements IDebate<T> {
  public _id: ObjectID;
  public createdAt: Date;
  public type: DebateType;
  public state: DebateState;
  public payload: T;

  /**
   * Class constructor.
   */
  constructor (
    data: IDebate<T>
  ) {
    this._id = data._id;
    this.createdAt = data.createdAt;
    this.type = data.type;
    this.state = data.state;
    this.payload = data.payload;
  }
}
