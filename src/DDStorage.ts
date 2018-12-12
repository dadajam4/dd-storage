import {
  Engines,
  StorageConfig,
  configDefaults,
  States,
  TTLType,
} from './constants';
import {
  checkAvailability,
  getFormatError,
  isObject,
  clone,
  convertCustomTTLToDate,
} from './utils';
import DDStorageError from './DDStorageError';

interface StorageValues {
  [key: string]: any;
}

interface StorageTTL {
  [key: string]: string;
}

interface StorageData {
  values: StorageValues;
  TTL: StorageTTL;
}

export default class DDStorage {
  static readonly Engines = Engines;
  static readonly States = States;
  static readonly Error = DDStorageError;

  readonly engine: Engines;
  readonly storage!: Storage;
  readonly namespace: string;

  public state: States;

  /**
   * [[DDStorage]]インスタンスが操作可能であるか否かを示します
   */
  get isReady(): boolean {
    return this.state === States.READY;
  }

  /**
   * [[DDStorage]]インスタンスが保有するデータのbyte数を示します
   */
  get size(): number {
    return this._getSource().length;
  }

  constructor(config: Partial<StorageConfig> = {}) {
    const mergedConfig: StorageConfig = {
      ...configDefaults,
      ...config,
    };

    this.engine = mergedConfig.engine;
    this.namespace = mergedConfig.namespace;

    if (this.engine === Engines.Local) {
      try {
        checkAvailability(this.engine);
        this.storage = window[this.engine];
      } catch (err) {
        this.engine = Engines.Session;
        console.warn(
          'Since localStorage can not be used, it falls back to sessionStorage.',
        );
      }
    }

    try {
      checkAvailability(this.engine);
      this.state = States.READY;
    } catch (err) {
      if (err instanceof DDStorageError) {
        this.state = err.code;
      } else {
        this.state = States.EXCEPTION;
      }
      throw err;
    }

    this.storage = window[this.engine];
    this._restore();
    this._setupUpdateObserver();
  }

  /**
   * 指定したキーの値を返却します
   * @param key
   * @param defaultValue
   */
  public get(key: string, defaultValue: any = null): any {
    const ttl = this.getTTL(key);
    if (ttl !== undefined) {
      const currentTime = +new Date();
      if (ttl < currentTime) {
        this.remove(key);
        return defaultValue;
      }
    }
    const value = this._data.values[key];
    if (value === undefined) return defaultValue;
    return clone(value);
  }

  /**
   * 指定したキーが存在するか否かを返却します
   * @param key
   */
  public hasKey(key: string): boolean {
    return this._data.values.hasOwnProperty(key);
  }

  /**
   * 指定したキーで値を保存します。有効期限を設定可能です。
   * @param key
   * @param value
   * @param ttl
   */
  public set(key: string, value: any, ttl?: TTLType): DDStorageError | void {
    if (value === undefined) return this.remove(key);
    this._data.values[key] = clone(value);
    return this.setTTL(key, ttl);
  }

  /**
   * 指定したキーの有効期限を返却します
   * @param key
   */
  public getTTL(key: string): number | void {
    return parseInt(this._data.TTL[key], 10);
  }

  /**
   * 指定したキーの有効期限を設定します
   * @param key
   * @param ttl
   */
  public setTTL(key: string, ttl: TTLType = 0): DDStorageError | void {
    if (!this.hasKey(key)) return;

    if (ttl === 0) {
      delete this._data.TTL[key];
      return this._save();
    }

    let ttlValue: string;
    if (typeof ttl === 'number') {
      ttlValue = String(+new Date() + ttl * 1000);
    } else if (ttl instanceof Date) {
      ttlValue = String(+ttl);
    } else {
      ttl = convertCustomTTLToDate(ttl);
      ttlValue = String(+ttl);
    }

    this._data.TTL[key] = ttlValue;
    return this._save();
  }

  /**
   * 指定したキーを削除します
   * @param key
   */
  public remove(key: string): DDStorageError | void {
    delete this._data.values[key];
    delete this._data.TTL[key];
    return this._save();
  }

  /**
   * インスタンスが保有しているデータを全て削除します
   */
  public clear(): DDStorageError | void {
    try {
      if (this.isReady) this.storage.removeItem(this.namespace);
      this._data = {
        values: {},
        TTL: {},
      };
    } catch (err) {
      return getFormatError(err);
    }
  }

  private _data: StorageData = {
    values: {},
    TTL: {},
  };

  private _getSource(): string {
    return (this.storage && this.storage.getItem(this.namespace)) || '';
  }
  private _updateObserver!: (e: StorageEvent) => void;

  private _setupUpdateObserver() {
    this._closeUpdateObserver();
    this._updateObserver = (e: StorageEvent) => {
      this._restore();
    };
    window.addEventListener('storage', this._updateObserver, false);
  }

  private _closeUpdateObserver() {
    if (!this._updateObserver) return;
    window.removeEventListener('storage', this._updateObserver, false);
    delete this._updateObserver;
  }

  private _restore(): DDStorageError | void {
    let parsed: StorageData | undefined;
    try {
      parsed = JSON.parse(this._getSource());
    } catch (err) {}

    if (isObject(parsed)) {
      this._data.values = isObject(parsed.values) ? parsed.values : {};
      this._data.TTL = isObject(parsed.TTL) ? parsed.TTL : {};
    } else {
      this._data = {
        values: {},
        TTL: {},
      };
    }
    this._cleanUpTTL();
  }

  private _cleanUpTTL(): DDStorageError | void {
    const currentTime = +new Date();
    const { TTL, values } = this._data;
    let needSave = false;
    for (const key in TTL) {
      if (parseInt(TTL[key], 10) < currentTime) {
        delete values[key];
        delete TTL[key];
        needSave = true;
      }
    }

    if (!this.isReady) return;
    if (needSave) return this._save();
  }

  private _save(): DDStorageError | void {
    if (!this.isReady) return;

    try {
      this.storage.setItem(this.namespace, JSON.stringify(this._data));
    } catch (err) {
      console.warn(err);
      return getFormatError(err);
    }
  }
}
