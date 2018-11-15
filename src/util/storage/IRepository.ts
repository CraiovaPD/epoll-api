/**
 * Interface representing a generic repository.
 *
 * @author Dragos Sebestin
 */
export interface IRepository <T, IdType = string> {

  /**
   * Save a value to the store.
   */
  add (t: T) : Promise<void>;

  /**
   * Add multiple objects to the store.
   */
  addMany (t: T[]) : Promise<void>;

  /**
   * Find by id.
   */
  findById (id: IdType) : Promise<T | null>;

  /**
   * Find by any field.
   */
  find (filters: Partial<T>, options?: {
    sort?: {field: string, descending?: boolean}
  }) : Promise<T[]>;

  /**
   * Update.
   */
  updateOne (id: IdType, newValue: Partial<T>) : Promise<void>;

  /**
   * Remove a document.
   */
  removeOne (id: IdType) : Promise<void>;

  /**
   * Remove multiple objects depending on a filter.
   */
  removeMany (filters: Partial<T>) : Promise<void>;

  /**
   * Count documents.
   */
  count (filters: Partial<T>) : Promise<number>;
}
