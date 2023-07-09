import { Base } from './base.js'

export type CharsetInput = Charset | CharsetRawInput

export type CharsetRawInput =
  | string
  | number
  | [string, string]
  | [number, number]

export type CharsetDataUnit = [number, number]

const enum SurrogateLimit {
  Min = 0x10000,
  MinL = 0xdc00,
  MaxL = 0xdfff,
}

export class Charset extends Base {
  public data: CharsetDataUnit[]

  constructor(...inputs: CharsetInput[]) {
    super()

    this.data = []
    for (const input of inputs) {
      if (input instanceof Charset) {
        this.data.push(...input.data)
      } else {
        this.data.push(normalize(input))
      }
    }
    this._unique()
  }

  public union(...inputs: CharsetInput[]) {
    return new Charset(this, ...inputs)
  }

  public subtract(...inputs: CharsetInput[]) {
    const current_data = this.data.slice()
    const new_data: CharsetDataUnit[] = []

    let subtract_index = 0
    const { data: subtract_data } = new Charset(...inputs)

    while (current_data.length !== 0) {
      const data_unit = current_data.shift()!
      const [start, end] = data_unit

      let is_done: boolean
      do {
        is_done = true

        const subtract_data_unit = subtract_data[subtract_index] as
          | undefined
          | CharsetDataUnit

        if (subtract_data_unit === undefined) {
          new_data.push(data_unit)
          break
        }

        const [subtract_start, subtract_end] = subtract_data_unit

        if (subtract_end < start) {
          // front + no overlap
          is_done = false
          subtract_index++
        } else if (end < subtract_start) {
          // back + no overlap
          new_data.push(data_unit)
        } else if (subtract_start <= start && subtract_end < end) {
          // front overlap
          subtract_index++
          current_data.unshift([subtract_end + 1, end])
        } else if (start < subtract_start && subtract_end < end) {
          // central overlap
          subtract_index++
          new_data.push([start, subtract_start - 1])
          current_data.unshift([subtract_end + 1, end])
        } else if (start < subtract_start && end <= subtract_end) {
          // back overlap
          new_data.push([start, subtract_start - 1])
        } // else: entire overlap
      } while (!is_done)
    }

    return new Charset(...new_data)
  }

  public intersect(...inputs: CharsetInput[]) {
    return this.subtract(this.subtract(...inputs))
  }

  protected _is_empty() {
    return this.data.length === 0
  }

  protected _to_string() {
    return ranges_to_string(this.data)
  }

  private _unique() {
    this.data.sort(compare)

    const new_data: CharsetDataUnit[] = []

    let last_data_unit: CharsetDataUnit | null = null
    for (const data_unit of this.data) {
      if (last_data_unit === null || last_data_unit[1] + 1 < data_unit[0]) {
        new_data.push(data_unit)
        last_data_unit = data_unit
      } else {
        new_data.splice(-1, 1, [
          Math.min(data_unit[0], last_data_unit[0]),
          Math.max(data_unit[1], last_data_unit[1]),
        ])
        last_data_unit = new_data[new_data.length - 1]
      }
    }

    this.data = new_data
  }
}

export const charset = (...inputs: CharsetInput[]) => new Charset(...inputs)

function char_code(char: string) {
  if (char.length !== 1) {
    const display = `${char.length} (${JSON.stringify(char)})`
    throw new Error(`Expected length = 1, but received ${display}.`)
  }
  return char.charCodeAt(0)
}

function normalize(raw_input: CharsetRawInput) {
  if (
    typeof raw_input === 'number' &&
    (raw_input < 0 || raw_input > 0x10ffff)
  ) {
    throw new Error(
      `Invalid unicode code point detected: ${
        raw_input < 0 ? raw_input : `0x${raw_input.toString(16)}`
      }`,
    )
  }
  const [normalized] = [raw_input]
    .map(x => (typeof x !== 'object' ? [x, x] : x))
    .map(x => x.map(u => (typeof u === 'string' ? char_code(u) : u)))
  return normalized as CharsetDataUnit
}

function compare(a: CharsetDataUnit, b: CharsetDataUnit) {
  return a[0] - b[0]
}

/* -------------------------------------------------------------------------- */

interface Surrogate {
  entire: Charset
  partial: Array<{ h: number; l: Charset }>
}

function ranges_to_string(ranges: CharsetDataUnit[]) {
  const { normal, surrogate } = split_ranges(ranges)

  const patterns: string[] = []

  if (normal.length !== 0) {
    patterns.push(normal_to_pattern(normal))
  }

  patterns.push(...surrogate_to_patterns(surrogate))

  return patterns.join('|')
}

function normal_to_pattern(normal: CharsetDataUnit[]) {
  const ranges = normal.map(([start, end]) =>
    start === end ? unicode(start) : `${unicode(start)}-${unicode(end)}`,
  )
  return `[${ranges.join('')}]`
}

function surrogate_to_patterns(surrogate: Surrogate) {
  const patterns: string[] = []

  if (surrogate.entire.data.length !== 0) {
    const h = surrogate.entire.toString()
    const l = `[${[SurrogateLimit.MinL, SurrogateLimit.MaxL]
      .map(unicode)
      .join('-')}]`
    patterns.push(`${h}${l}`)
  }

  for (const { h: raw_h, l: l_charset } of surrogate.partial) {
    const h = unicode(raw_h)
    const l = l_charset.toString()
    patterns.push(`${h}${l}`)
  }

  return patterns
}

function split_ranges(data: CharsetDataUnit[]) {
  const normal: CharsetDataUnit[] = []
  const surrogate_ranges: CharsetDataUnit[] = []

  for (let i = 0; i < data.length; i++) {
    const data_unit = data[i]
    const [start, end] = data_unit

    if (start >= SurrogateLimit.Min) {
      surrogate_ranges.push(...data.slice(i))
      break
    }

    if (end >= SurrogateLimit.Min) {
      normal.push([start, SurrogateLimit.Min - 1])
      surrogate_ranges.push([0x10000, end], ...data.slice(i + 1))
      break
    }

    normal.push(data_unit)
  }

  return { normal, surrogate: split_surrogate_ranges(surrogate_ranges) }
}

function split_surrogate_ranges(ranges: CharsetDataUnit[]) {
  interface SurrogateData {
    h: number
    l: CharsetDataUnit[]
  }

  const entire: number[] = []
  const partial: SurrogateData[] = []

  for (const [start, end] of ranges) {
    const start_pair = surrogate_pair(start)
    const end_pair = surrogate_pair(end)

    if (start_pair.h === end_pair.h) {
      add_partial_range(start_pair.h, start_pair.l, end_pair.l)
      continue
    }

    if (start_pair.l === SurrogateLimit.MinL) {
      add_entire_range(start_pair.h)
    } else {
      add_partial_range(start_pair.h, start_pair.l, SurrogateLimit.MaxL)
    }

    for (let h = start_pair.h + 1; h < end_pair.h; h++) {
      add_entire_range(h)
    }

    if (end_pair.l === SurrogateLimit.MaxL) {
      add_entire_range(end_pair.h)
    } else {
      add_partial_range(end_pair.h, SurrogateLimit.MinL, end_pair.l)
    }
  }

  return {
    entire: new Charset(...entire),
    partial: partial.map(({ h, l }) => ({ h, l: new Charset(...l) })),
  }

  function add_entire_range(h: number) {
    entire.push(h)
  }

  function add_partial_range(h: number, start: number, end: number) {
    const last_partial = partial[partial.length - 1] as
      | undefined
      | SurrogateData
    if (last_partial !== undefined && last_partial.h === h) {
      last_partial.l.push([start, end])
    } else {
      partial.push({ h, l: [[start, end]] })
    }
  }
}

// https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
function surrogate_pair(codepoint: number) {
  return {
    h: Math.floor((codepoint - 0x10000) / 0x400) + 0xd800,
    l: ((codepoint - 0x10000) % 0x400) + 0xdc00,
  }
}

function unicode(char: number) {
  const hex = char.toString(16)
  return `\\u${'0'.repeat(4 - hex.length)}${hex}`
}
