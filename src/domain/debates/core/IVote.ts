import { ObjectID } from 'mongodb';

/**
 * Poll vote interface.
 *
 * @author Dragos Sebestin
 */
export interface IVote {
  _id: ObjectID,
  createdAt: Date,
  userId: ObjectID,
  optionId: ObjectID
}
