import * as mongodb from 'mongodb';

/**
 * Namespace containing helper methods for
 * working with MongoDB.
 */
export async function ensureIndex(
  collection: mongodb.Collection,
  name: string,
  unique: boolean = false,
  text: boolean = false,
  ttl?: number
) {
  let indexType: any = 1;

  if (text) {
    indexType = 'text';
  }

  let index: any = {};
  index[name] = indexType;

  let indexOptions = {
    unique
  } as any;

  if (ttl) {
    indexOptions.expireAfterSeconds = ttl;
  }

  await collection.createIndex(index, indexOptions);
}
