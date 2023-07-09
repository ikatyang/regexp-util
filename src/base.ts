export abstract class Base {
  public isEmpty() {
    return this._isEmpty()
  }
  public toString() {
    if (this.isEmpty()) {
      throw new Error(`Output is empty.`)
    }
    return this._toString()
  }
  public toRegExp(flags?: string) {
    return new RegExp(this.toString(), flags)
  }

  protected abstract _isEmpty(): boolean
  protected abstract _toString(): string
}
