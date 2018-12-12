/**
 * 利用するストレージのエンジンを示します
 */
export enum Engines {
  Local = 'localStorage',
  Session = 'sessionStorage',
}

/**
 * [[DDStorage]]、及びその操作結果の状態を示します
 */
export enum States {
  /**
   * ストレージが利用可能である事を示します
   */
  READY = 'READY',

  /**
   * ブラウザがストレージ操作用のAPIに未対応である事を示します
   */
  NOT_AVAILABLE = 'NOT_AVAILABLE',

  /**
   * プライベートブラウズやブラウザの設定でストレージが無効である事を示します
   */
  DISABLED = 'DISABLED',

  /**
   * 保存上限に達している事を示します
   */
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',

  /**
   * ストレージ利用において何らかの例外が発生した事を示します
   */
  EXCEPTION = 'EXCEPTION',
}

/**
 * [[DDStorage]]の設定を示します
 * デフォルト値は[[configDefaults]]を参照してください。
 */
export interface StorageConfig {
  /**
   * @see: [[Engines]]
   */
  engine: Engines;

  /**
   * ストレージに保存する際の名前空間を示します。
   */
  namespace: string;
}

export const configDefaults: StorageConfig = {
  engine: Engines.Local,
  namespace: '__dd-storage__',
};

/**
 * 有効期限として設定可能なカスタム設定を示します。
 */
export type CustomTTLType =
  /**
   * 当日中のみ有効である事を示します
   */
  | 'today'

  /**
   * 当月中のみ有効である事を示します
   */
  | 'thisMonth'

  /**
   * 当年中のみ有効である事を示します
   */
  | 'thisYear'

  /**
   * 有効期限をオブジェクト形式で指定します
   */
  | {
      day?: number;
      month?: number;
      year?: number;
      hour?: number;
      minutes?: number;
      seconds?: number;
    };

/**
 * 有効期限設定の際に利用できる型情報を示します。
 */
export type TTLType = number | Date | CustomTTLType;
