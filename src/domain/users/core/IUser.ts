import { ObjectID } from 'mongodb';

export interface IUser {
  _id: ObjectID,
  phone: string,
  firstname: string,
  lastname?: string
}
