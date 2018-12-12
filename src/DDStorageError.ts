import { States } from './constants';

export default class DDStorage implements Error {
  public readonly name = 'StorageServiceError';

  constructor(public message: string, public code: States) {}

  public toString() {
    return this.name + ': ' + this.message;
  }
}
