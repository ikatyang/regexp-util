export abstract class Base {
  // tslint:disable-next-line:naming-convention
  public isEmpty() {
    return this._is_empty();
  }
  // tslint:disable-next-line:naming-convention
  public toString() {
    if (this.isEmpty()) {
      throw new Error(`Output is empty.`);
    }
    return this._to_string();
  }
  // tslint:disable-next-line:naming-convention
  public toRegExp(flags?: string) {
    return new RegExp(this.toString(), flags);
  }

  protected abstract _is_empty(): boolean;
  protected abstract _to_string(): string;
}
