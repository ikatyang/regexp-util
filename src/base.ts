export abstract class Base {
  public isEmpty() {
    return this._isEmpty()
  }
  public toString(flags?: string) {
    if (this.isEmpty()) {
      throw new Error(`Output is empty.`)
    }
    return this._toString(flags)
  }
  public toRegExp(flags?: string) {
    return new RegExp(this.toString(flags), flags)
  }

  protected abstract _isEmpty(): boolean
  protected abstract _toString(flags?: string): string
}
