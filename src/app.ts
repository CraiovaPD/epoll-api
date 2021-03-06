import {MongoClient} from 'mongodb';
import {setLocale} from 'exceptional.js';
import * as nconf from 'nconf';
import EPollErrors from 'epoll-errors';

// plumbing
import {Logger} from './util/process/logger';
// import {MongoRepository} from './util/storage/mongoRepository';
// import * as MongoHelper from './util/helpers/mongo';
import {IFileStore} from './util/storage/IFileStore';
import {DiskStore} from './util/storage/diskStore';
import {S3Store} from './util/storage/s3Store';

// services
// import {RateLimiter} from './application/rateLimiter';
import {ServiceRegistry} from './application/serviceRegistry';
import {get as UserServiceFactory} from './domain/users';
import {get as DebateServiceFactory} from './domain/debates';
import {get as StorageServiceFactory} from './domain/storage';

// gateway
import {get as ApiGatewayFactory, ApiGateway} from './gateway';

/**
 * Class representing the application object.
 *
 * @author Dragos Sebestin
 */
export class EPoll {
  private _mongoClients: MongoClient[] = [];

  public serviceRegistry = new ServiceRegistry(); // make it public for import usage
  public apiGateway: ApiGateway | undefined;

  /**
   * Class constructor.
   */
  constructor () {
    // initialize error subsystem
    EPollErrors();
    setLocale('ro');
  }

  /**
   * Start the application.
   */
  async start () {
    // init services
    await this._initUsers();
    await this._initDebates();
    await this._initStorage();

    // init api gateway
    await this._initGateway();

    Logger.get().write('*** E Poll started ***');
  }

  /**
   * Stop the application.
   */
  async stop () {
    // close MongoDB connection
    for (let client of this._mongoClients) {
      await client.close();
    }
    Logger.get().write('*** E Poll closed ***');
  }

  /**
   * Initialize the user service.
   */
  private async _initUsers () {
    let mongoClient = await MongoClient.connect(
      nconf.get('user:db:url'), {
        useNewUrlParser: true
      }
    );
    this._mongoClients.push(mongoClient);

    let db = mongoClient.db(nconf.get('user:db:name'));
    let userService = UserServiceFactory(
      db,
      nconf.get('user:authorization:facebookAccountKit:appId'),
      nconf.get('user:authorization:facebookAccountKit:appSecret'),
      nconf.get('user:authorization:OAuthClients')
    );
    this.serviceRegistry.add(userService);
  }

  /**
   * Initialize the debate service.
   */
  private async _initDebates () {
    let mongoClient = await MongoClient.connect(
      nconf.get('debate:db:url'), {
        useNewUrlParser: true
      }
    );
    this._mongoClients.push(mongoClient);

    let db = mongoClient.db(nconf.get('debate:db:name'));
    let debateService = DebateServiceFactory(
      db
    );
    this.serviceRegistry.add(debateService);
  }

  /**
   * Initialize the storage service.
   */
  private async _initStorage () {
    let fileStore: IFileStore;
    let isStorageLocal = true; // nconf.get('config') === 'debug'
    if (isStorageLocal) {
      fileStore = new DiskStore(
        nconf.get('fileStore:path'),
        nconf.get('hostname')
      );
    } else {
      fileStore = new S3Store(
        nconf.get('fileStore:path'),
        nconf.get('fileStore:awsKeyId'),
        nconf.get('fileStore:awsKeySecret'),
        nconf.get('fileStore:bucketName')
      );
    }

    let storageService = StorageServiceFactory(
      nconf.get('fileStore:path'), fileStore
    );
    this.serviceRegistry.add(storageService);
  }

  /**
   * Initialize API gateway.
   */
  private async _initGateway () {
    this.apiGateway = ApiGatewayFactory(
      nconf.get('engine:version'),
      this.serviceRegistry
    );
  }
}
