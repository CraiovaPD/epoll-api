import { ObjectID } from 'mongodb';
import {context} from 'exceptional.js';
import {DEBATE_NAMESPACE} from 'epoll-errors';

import { Debate } from './debate';
import { IPollDebate } from './IDebate';
import { IAttachment } from './IAttachment';
import { IVote } from './IVote';

const EXCEPTIONAL = context(DEBATE_NAMESPACE);

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

  /**
   * Add a new vote.
   */
  addVote (newVote: IVote) {
    // check if this user has already voted
    // on this poll
    let hasAlreadyVoted = ~this.payload.votes.data.findIndex(
      (vote: IVote) => String(vote.userId) === String(newVote.userId)
    );

    if (hasAlreadyVoted) {
      throw EXCEPTIONAL.DomainException(11, {});
    }

    // check if option exists
    let foundOption = this.payload.options.findIndex(
      option => String(option._id) === String(newVote.optionId)
    );
    if (!~foundOption) {
      throw EXCEPTIONAL.DomainException(12, {});
    }

    this.payload.votes.data.push(newVote);
    this.payload.votes.count++;
  }
}
