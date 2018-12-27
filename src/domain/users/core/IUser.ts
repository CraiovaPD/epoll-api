import { ObjectID } from 'mongodb';
import { UserRole } from '../../../types/users/IUser';

export interface IUser {
  _id: ObjectID,
  phone: string,
  role: UserRole,
  firstname: string,
  lastname?: string
}
