import { Base } from './base';

export type CharsetInput = Charset | CharsetRawInput;

export type CharsetRawInput =
  | string
  | number
  | [string, string]
  | [number, number];

export type CharsetDataUnit = [number, number];

export const charset = (...inputs: CharsetInput[]) => new Charset(...inputs);

export class Charset extends Base {
  public data: CharsetDataUnit[];

  constructor(...inputs: CharsetInput[]) {
    super();

    this.data = [];
    for (const input of inputs) {
      if (input instanceof Charset) {
        this.data.push(...input.data);
      } else {
        this.data.push(normalize(input));
      }
    }
    this._unique();
  }

  public union(...inputs: CharsetInput[]) {
    return new Charset(this, ...inputs);
  }

  protected _is_empty() {
    return this.data.length === 0;
  }

  protected _to_string() {
    const ranges = this.data.map(
      ([start, end]) =>
        start === end ? unicode(start) : `${unicode(start)}-${unicode(end)}`,
    );
    return `[${ranges.join('')}]`;
  }

  private _unique() {
    this.data.sort(compare);

    const new_data: CharsetDataUnit[] = [];

    let last_data_unit: CharsetDataUnit | null = null;
    for (const data_unit of this.data) {
      if (!last_data_unit || last_data_unit[1] + 1 < data_unit[0]) {
        new_data.push(data_unit);
        last_data_unit = data_unit;
      } else {
        new_data.splice(-1, 1, [last_data_unit[0], data_unit[1]]);
        last_data_unit = new_data[new_data.length - 1];
      }
    }

    this.data = new_data;
  }
}

function unicode(char: number) {
  return `\\u{${char.toString(16)}}`;
}

function char_code(char: string) {
  if (char.length !== 1) {
    const display = `${char.length} (${JSON.stringify(char)})`;
    throw new Error(`Expected length = 1, but received ${display}.`);
  }
  return char.charCodeAt(0);
}

function normalize(raw_input: CharsetRawInput) {
  const [normalized] = [raw_input]
    .map(x => (typeof x !== 'object' ? [x, x] : x))
    .map(x => x.map(u => (typeof u === 'string' ? char_code(u) : u)));
  return normalized as CharsetDataUnit;
}

function compare(a: CharsetDataUnit, b: CharsetDataUnit) {
  return a[0] - b[0];
}
