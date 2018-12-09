import { ObjectID } from 'mongodb';

import { Debate } from './debate';
import { IPollDebate } from './IDebate';

/**
 * Poll concrete class of a debate.
 *
 * @author Dragos Sebestin
 */
export class PollDebate extends Debate<IPollDebate> {

  /**
   * Add a new poll option.
   */
  addOption (option: {
    _id: ObjectID,
    reason: string
  }) {
    this.payload.options.push({
      _id: option._id,
      reason: option.reason
    });
  }

  /**
   * Remove a poll option.
   */
  removeOption (optionId: ObjectID) {
    let foundIndex = this.payload.options.findIndex(
      option => String(option._id) === String(optionId)
    );

    if (~foundIndex) {
      this.payload.options.splice(foundIndex, 1);
    }
  }
}
