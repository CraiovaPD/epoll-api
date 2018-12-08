import { ObjectID } from 'mongodb';

/**
 * Interface used for storring pairs of
 * code => access_token for account kit.
 *
 * Used because of how we manage user registrations.
 * Account Kit does not allow us to get an access token
 * from an access code multiple times via their API.
 */
export interface IAccountKitToken {
  _id: ObjectID,
  code: string,
  token: string,
  createdAt: Date
}
