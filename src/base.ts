export abstract class Base {
  // tslint:disable-next-line:naming-convention
  public abstract toString(): string;
  // tslint:disable-next-line:naming-convention
  public toRegExp(flags?: string) {
    return new RegExp(this.toString(), flags);
  }
}
