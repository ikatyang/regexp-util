import { Base } from './base';
import { Charset, CharsetInput } from './charset';

export type OrInput = string | CharsetInput;

export class Or extends Base {
  public charset: Charset;
  public strings: Set<string>;

  constructor(...inputs: OrInput[]) {
    super();

    this.strings = new Set();
    const charset_inputs: CharsetInput[] = [];

    for (const input of inputs) {
      if (typeof input !== 'string' || input.length === 1) {
        charset_inputs.push(input);
      } else {
        this.strings.add(input);
      }
    }

    this.charset = new Charset(...charset_inputs);
  }

  public union(...inputs: OrInput[]) {
    return new Or(this.charset, ...this.strings, ...inputs);
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

    return `(?:${parts.join('|')})`;
  }
}

export const or = (...inputs: OrInput[]) => new Or(...inputs);
