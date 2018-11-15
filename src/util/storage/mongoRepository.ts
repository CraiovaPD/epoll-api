import * as mongodb from 'mongodb';
import {IRepository} from './IRepository';
import { setTimeout } from 'timers';

/**
 * MongoDB backed repository implementation.
 *
 * @implements IRepository
 * @author Dragos Sebestin
 */
export class MongoRepository <T> implements IRepository <T, mongodb.ObjectID> {

  /**
   * Class constructor.
   */
  constructor (
    private _collection: mongodb.Collection<T>
  ) { }

  /**
   * Get raw storage.
   */
  get collection () : mongodb.Collection<T> {
    return this._collection;
  }

  /**
   * IRepository interface methods.
   */
  async add (t: T) {
    let resp = await this._collection.insertOne(t);
    if (resp.result.ok !== 1)
      throw new Error(`Failed to insert document ${JSON.stringify(t)}.`);
  }

  async addMany (t: T[]) : Promise<void> {
    let resp = await this._collection.insertMany(t);
    if (resp.result.ok !== 1)
      throw new Error(`Failed to insert documents ${JSON.stringify(t)}.`);
  }

  async findById (id: mongodb.ObjectID) : Promise<T | null> {
    for (let i = 0; i < 10; i++) {
      let found = await this._collection.findOne({_id: id});
      if (found)
        return found;

      await this._sleep(30);
    }

    return null;
  }

  find (filters: Partial<T> = {}, options?: {
    sort?: {field: string, descending?: boolean},
    limit?: number
  }) : Promise<T[]> {
    let query = this._collection.find(this._getFindQuery(filters));

    if (options) {
      if (options.sort) {
        let direction = 1;
        if (options.sort.descending)
          direction = -1;
        query = query.sort(options.sort.field, direction);
      }

      if (options.limit) {
        query.limit(options.limit);
      }
    }

    return query.toArray();
  }

  async updateOne (id: mongodb.ObjectID, newValue: Partial<T>) : Promise<void> {
    let update = this._getUpdateDoc(newValue);
    let resp = await this._collection.updateOne({_id: id}, update);
    if (resp.result.ok !== 1)
      throw new Error(`Failed to update document ${JSON.stringify(newValue)}.`);
  }

  async removeOne (id: mongodb.ObjectID) : Promise<void> {
    let resp = await this._collection.remove({_id: id});
    if (resp.result.ok !== 1)
      throw new Error(`Failed to remove document with id ${id.toString()}.`);
  }

  async removeMany (filters: Partial<T>) : Promise<void> {
    let resp = await this._collection.remove(filters);
    if (resp.result.ok !== 1)
      throw new Error(`Failed to remove documents.`);
  }

  async count (filters: Partial<T> = {}) : Promise<number> {
    return this._collection.count(filters);
  }

  private _getUpdateDoc (value: Partial<T>) : {} {
    let update = {
      $set: {}
    } as any;
    for (let key in value) {
      update.$set[key] = value[key];
    }

    return update;
  }

  /**
   * Construct a MongoDB find query from a partial object.
   */
  private _getFindQuery (partial: any, rootKey: string = '', query: any = {}) {
    let keyPrefix = rootKey ? rootKey + '.' : '';

    for (let key in partial) {
      let value = partial[key];
      if (
        value instanceof mongodb.ObjectID ||
        value instanceof Date ||
        value === null
      ) {
        query[keyPrefix + key] = value;
      } else if (typeof value === 'object') {
        query = this._getFindQuery(value, key, query);
      } else {
        query[keyPrefix + key] = value;
      }
    }

    return query;
  }

  private _sleep (timeout: number) : Promise<void> {
    return new Promise<void>((resolve) => {
      setTimeout(resolve, timeout);
    });
  }
}
