export abstract class Base {
  public isEmpty() {
    return this._is_empty()
  }
  public toString() {
    if (this.isEmpty()) {
      throw new Error(`Output is empty.`)
    }
    return this._to_string()
  }
  public toRegExp(flags?: string) {
    return new RegExp(this.toString(), flags)
  }

  protected abstract _is_empty(): boolean
  protected abstract _to_string(): string
}
