import { ObjectID } from 'mongodb';
import {context} from 'exceptional.js';
import {DEBATE_NAMESPACE} from 'epoll-errors';

import { Debate } from './debate';
import { IAnoucementDebate } from './IDebate';
import { IAttachment } from './IAttachment';

const EXCEPTIONAL = context(DEBATE_NAMESPACE);
EXCEPTIONAL;

/**
 * Anouncement concrete class of a debate.
 *
 * @author Dragos Sebestin
 */
export class AnouncementDebate extends Debate<IAnoucementDebate> {

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
