import { Base } from './base';

export type CharsetInput = Charset | CharsetRawInput;

export type CharsetRawInput =
  | string
  | number
  | [string, string]
  | [number, number];

export type CharsetDataUnit = [number, number];

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

  public subtract(...inputs: CharsetInput[]) {
    const new_data: CharsetDataUnit[] = [];

    let subtract_index = 0;
    const { data: subtract_data } = new Charset(...inputs);

    for (const data_unit of this.data) {
      const [start, end] = data_unit;

      let is_done: boolean;
      do {
        is_done = true;

        const subtract_data_unit = subtract_data[subtract_index] as
          | undefined
          | CharsetDataUnit;

        if (subtract_data_unit === undefined) {
          new_data.push(data_unit);
          break;
        }

        const [subtract_start, subtract_end] = subtract_data_unit;

        if (subtract_end < start) {
          // front + no overlap
          is_done = false;
          subtract_index++;
        } else if (end < subtract_start) {
          // back + no overlap
          new_data.push(data_unit);
        } else if (subtract_start <= start && subtract_end < end) {
          // front overlap
          subtract_index++;
          new_data.push([subtract_end + 1, end]);
        } else if (start < subtract_start && subtract_end < end) {
          // central overlap
          subtract_index++;
          new_data.push([start, subtract_start - 1], [subtract_end + 1, end]);
        } else if (start < subtract_start && end <= subtract_end) {
          // back overlap
          new_data.push([start, subtract_start - 1]);
        } // else: entire overlap
      } while (!is_done);
    }

    return new Charset(...new_data);
  }

  public intersect(...inputs: CharsetInput[]) {
    return this.subtract(this.subtract(...inputs));
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
      if (last_data_unit === null || last_data_unit[1] + 1 < data_unit[0]) {
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

export const charset = (...inputs: CharsetInput[]) => new Charset(...inputs);

function unicode(char: number) {
  const hex = char.toString(16);
  return char > 0xffff
    ? `\\u{${hex}}`
    : `\\u${'0'.repeat(4 - hex.length)}${hex}`;
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
