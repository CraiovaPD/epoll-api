import {Db} from 'mongodb';

import {DebateService} from './service';

export function get (
  debateDb: Db
) : DebateService {

  let debatesCollection = debateDb.collection('debates');
  let service = new DebateService(
    debatesCollection
  );

  return service;
}
