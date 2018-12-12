import { Engines, States, CustomTTLType } from './constants';
import DDStorageError from './DDStorageError';

/**
 * ストレージの利用可能状況を返却します
 * @param engine
 * @throws [[DDStorageError]]
 */
export function checkAvailability(engine: Engines): boolean {
  let err: DDStorageError;
  let itemsLength = 0;

  // Firefox sets [local]Storage to 'null' if support is disabled
  // IE might go crazy if quota is exceeded and start treating it as 'unknown'
  if (
    window[engine] === null ||
    (typeof window[engine] as string) === 'unknown'
  ) {
    err = new DDStorageError('storage is disabled', States.DISABLED);
    throw err;
  }

  // There doesn't seem to be any indication about [local]Storage support
  if (!window[engine]) {
    err = new DDStorageError('storage not supported', States.NOT_AVAILABLE);
    throw err;
  }

  try {
    itemsLength = window[engine].length;
  } catch (E) {
    throw getFormatError(E);
  }

  try {
    // we try to set a value to see if [local]Storage is really usable or not
    window[engine].setItem('__storage-init-test__', (+new Date()).toString(16));
    window[engine].removeItem('__storage-init-test__');
  } catch (E) {
    if (itemsLength) {
      // there is already some data stored, so this might mean that storage is full
      throw getFormatError(E);
    } else {
      // we do not have any data stored and we can't add anything new
      // so we are most probably in Private Browsing mode where
      // [local]Storage is turned off in some browsers (max storage size is 0)
      err = new DDStorageError('storage is disabled', States.DISABLED);
      throw err;
    }
  }
  return true;
}

export function getFormatError(E: Error): DDStorageError {
  const code = (E as any).code;
  const number = (E as any).number;

  if (
    code === 22 ||
    code === 1014 ||
    [-2147024882, -2146828281, -21474675259].indexOf(number) > 0
  ) {
    // No more storage:
    // Mozilla: NS_ERROR_DOM_QUOTA_REACHED, code 1014
    // WebKit: QuotaExceededError/QUOTA_EXCEEDED_ERR, code 22
    // IE number -2146828281: Out of memory
    // IE number -2147024882: Not enough storage is available to complete this operation
    return new DDStorageError('storage quota exceeded', States.QUOTA_EXCEEDED);
  }

  if (code === 18 || code === 1000) {
    // SecurityError, [local]Storage is turned off
    return new DDStorageError('storage is disabled', States.DISABLED);
  }

  // We are trying to access something from an object that is either null or undefined
  if (E.name === 'TypeError') {
    return new DDStorageError('storage is disabled', States.DISABLED);
  }

  return new DDStorageError(E.message, States.EXCEPTION);
}

export function isObject(obj: any): obj is object {
  return obj !== null && typeof obj === 'object';
}

export function clone(obj: any): any {
  if (obj === undefined) return;
  return JSON.parse(JSON.stringify(obj));
}

export function convertCustomTTLToDate(type: CustomTTLType): Date {
  if (type === 'today' || type === 'thisMonth' || type === 'thisYear') {
    const today = new Date();
    const yearAmmount = type === 'thisYear' ? 1 : 0;
    const monthAmmount = type === 'thisMonth' ? 1 : 0;
    const dayAmmount = type === 'today' ? 1 : 0;
    return new Date(
      today.getFullYear() + yearAmmount,
      today.getMonth() + monthAmmount,
      today.getDate() + dayAmmount,
    );
  }

  const result = new Date();
  if (typeof type.year === 'number')
    result.setFullYear(result.getFullYear() + type.year);
  if (typeof type.month === 'number')
    result.setMonth(result.getMonth() + type.month);
  if (typeof type.day === 'number') result.setDate(result.getDate() + type.day);
  if (typeof type.hour === 'number')
    result.setHours(result.getHours() + type.hour);
  if (typeof type.minutes === 'number')
    result.setMinutes(result.getMinutes() + type.minutes);
  if (typeof type.seconds === 'number')
    result.setSeconds(result.getSeconds() + type.seconds);
  return result;
}
