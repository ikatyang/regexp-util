import { Base } from './base';
import { Charset, CharsetInput } from './charset';
import { wrap } from './util';

export type OrInput = string | Or | CharsetInput;

export class Or extends Base {
  public charset: Charset;
  public strings: Set<string>;

  constructor(...inputs: OrInput[]) {
    super();

    const strings: string[] = [];
    const charset_inputs: CharsetInput[] = [];

    for (const input of inputs) {
      if (input instanceof Or) {
        strings.push(...input.strings);
        charset_inputs.push(input.charset);
      } else if (
        typeof input !== 'string' ||
        (input.length === 1 && !is_special_char(input))
      ) {
        charset_inputs.push(input);
      } else {
        strings.push(input);
      }
    }

    this.strings = new Set(strings);
    this.charset = new Charset(...charset_inputs);
  }

  public union(...inputs: OrInput[]) {
    return new Or(this.charset, ...this.strings, ...inputs);
  }

  public subtract(...inputs: OrInput[]) {
    const strings = new Set(this.strings);
    const charset = new Charset(...this.charset.data);

    const charset_inputs: CharsetInput[] = [];
    for (const input of inputs) {
      if (input instanceof Or) {
        for (const str of input.strings) {
          strings.delete(str);
        }
        charset_inputs.push(input.charset);
      } else if (
        typeof input !== 'string' ||
        (input.length === 1 && !is_special_char(input))
      ) {
        charset_inputs.push(input);
      } else {
        strings.delete(input);
      }
    }

    return new Or(charset.subtract(...charset_inputs), ...strings);
  }

  protected _is_empty() {
    return this.charset.isEmpty() && this.strings.size === 0;
  }

  protected _to_string() {
    const parts: string[] = [];

    if (this.charset.data.length !== 0) {
      parts.push(this.charset.toString());
    }

    if (this.strings.size !== 0) {
      parts.push(...this.strings);
    }

    return wrap(parts.join('|'));
  }
}

export const or = (...inputs: OrInput[]) => new Or(...inputs);

function is_special_char(char: string) {
  switch (char) {
    case '^':
    case '$':
      return true;
    default:
      return false;
  }
}
