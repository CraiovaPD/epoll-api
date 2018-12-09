import { ObjectID } from 'mongodb';

import { Debate } from './debate';
import { IPollDebate } from './IDebate';
import { IAttachment } from './IAttachment';

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

  /**
   * Add a new attachment.
   */
  addAttachment (attachment: IAttachment) {
    this.payload.attachments.push(attachment);
  }

  /**
   * Remove an attachment from this poll.
   */
  removeAttachment (attachmentId: ObjectID) {
    let foundIndex = this.payload.attachments.findIndex(
      att => String(att._id) === String(attachmentId)
    );

    if (~foundIndex) {
      this.payload.attachments.splice(foundIndex, 1);
    }
  }
}
