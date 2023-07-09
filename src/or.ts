import { Base } from './base.js'
import { Charset, CharsetInput } from './charset.js'
import { wrap } from './util.js'

export type OrInput = string | Or | CharsetInput

export class Or extends Base {
  public charset: Charset
  public strings: string[]

  constructor(...inputs: OrInput[]) {
    super()

    const strings: string[] = []
    const charset_inputs: CharsetInput[] = []

    for (const input of inputs) {
      if (input instanceof Or) {
        strings.push(...input.strings)
        charset_inputs.push(input.charset)
      } else if (
        typeof input !== 'string' ||
        (input.length === 1 && !is_special_char(input))
      ) {
        charset_inputs.push(input)
      } else {
        strings.push(input)
      }
    }

    this.strings = Object.keys(dictionaryify(strings))
    this.charset = new Charset(...charset_inputs)
  }

  public union(...inputs: OrInput[]) {
    return new Or(this.charset, ...this.strings, ...inputs)
  }

  public subtract(...inputs: OrInput[]) {
    const string_dictionay = dictionaryify(this.strings)
    const charset = new Charset(...this.charset.data)

    const charset_inputs: CharsetInput[] = []
    for (const input of inputs) {
      if (input instanceof Or) {
        for (const str of input.strings) {
          delete string_dictionay[str]
        }
        charset_inputs.push(input.charset)
      } else if (
        typeof input !== 'string' ||
        (input.length === 1 && !is_special_char(input))
      ) {
        charset_inputs.push(input)
      } else {
        delete string_dictionay[input]
      }
    }

    return new Or(
      charset.subtract(...charset_inputs),
      ...Object.keys(string_dictionay),
    )
  }

  protected _is_empty() {
    return this.charset.isEmpty() && this.strings.length === 0
  }

  protected _to_string() {
    const parts: string[] = []

    if (this.charset.data.length !== 0) {
      parts.push(this.charset.toString())
    }

    if (this.strings.length !== 0) {
      parts.push(...this.strings)
    }

    return wrap(parts.join('|'))
  }
}

export const or = (...inputs: OrInput[]) => new Or(...inputs)

function is_special_char(char: string) {
  switch (char) {
    case '^':
    case '$':
      return true
    default:
      return false
  }
}

function dictionaryify(array: string[]) {
  const dictionary: Record<string, true> = {}
  for (const value of array) {
    dictionary[value] = true
  }
  return dictionary
}
