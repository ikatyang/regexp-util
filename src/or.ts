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
    const charsetInputs: CharsetInput[] = []

    for (const input of inputs) {
      if (input instanceof Or) {
        strings.push(...input.strings)
        charsetInputs.push(input.charset)
      } else if (
        typeof input !== 'string' ||
        (input.length === 1 && !isSpecialChar(input))
      ) {
        charsetInputs.push(input)
      } else {
        strings.push(input)
      }
    }

    this.strings = Object.keys(dictionaryify(strings))
    this.charset = new Charset(...charsetInputs)
  }

  public union(...inputs: OrInput[]) {
    return new Or(this.charset, ...this.strings, ...inputs)
  }

  public subtract(...inputs: OrInput[]) {
    const stringDictionary = dictionaryify(this.strings)
    const charset = new Charset(...this.charset.data)

    const charsetInputs: CharsetInput[] = []
    for (const input of inputs) {
      if (input instanceof Or) {
        for (const str of input.strings) {
          delete stringDictionary[str]
        }
        charsetInputs.push(input.charset)
      } else if (
        typeof input !== 'string' ||
        (input.length === 1 && !isSpecialChar(input))
      ) {
        charsetInputs.push(input)
      } else {
        delete stringDictionary[input]
      }
    }

    return new Or(
      charset.subtract(...charsetInputs),
      ...Object.keys(stringDictionary),
    )
  }

  protected _isEmpty() {
    return this.charset.isEmpty() && this.strings.length === 0
  }

  protected _toString() {
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

function isSpecialChar(char: string) {
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
