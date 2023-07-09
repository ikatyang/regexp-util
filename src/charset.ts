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
    const currentData = this.data.slice()
    const newData: CharsetDataUnit[] = []

    let subtractIndex = 0
    const { data: subtractData } = new Charset(...inputs)

    while (currentData.length !== 0) {
      const dataUnit = currentData.shift()!
      const [start, end] = dataUnit

      let isDone: boolean
      do {
        isDone = true

        const subtractDataUnit = subtractData[subtractIndex] as
          | undefined
          | CharsetDataUnit

        if (subtractDataUnit === undefined) {
          newData.push(dataUnit)
          break
        }

        const [subtractStart, subtractEnd] = subtractDataUnit

        if (subtractEnd < start) {
          // front + no overlap
          isDone = false
          subtractIndex++
        } else if (end < subtractStart) {
          // back + no overlap
          newData.push(dataUnit)
        } else if (subtractStart <= start && subtractEnd < end) {
          // front overlap
          subtractIndex++
          currentData.unshift([subtractEnd + 1, end])
        } else if (start < subtractStart && subtractEnd < end) {
          // central overlap
          subtractIndex++
          newData.push([start, subtractStart - 1])
          currentData.unshift([subtractEnd + 1, end])
        } else if (start < subtractStart && end <= subtractEnd) {
          // back overlap
          newData.push([start, subtractStart - 1])
        } // else: entire overlap
      } while (!isDone)
    }

    return new Charset(...newData)
  }

  public intersect(...inputs: CharsetInput[]) {
    return this.subtract(this.subtract(...inputs))
  }

  protected _isEmpty() {
    return this.data.length === 0
  }

  protected _toString(flags?: string) {
    return rangesToString(this.data, flags)
  }

  private _unique() {
    this.data.sort(compare)

    const newData: CharsetDataUnit[] = []

    let lastDataUnit: CharsetDataUnit | null = null
    for (const dataUnit of this.data) {
      if (lastDataUnit === null || lastDataUnit[1] + 1 < dataUnit[0]) {
        newData.push(dataUnit)
        lastDataUnit = dataUnit
      } else {
        newData.splice(-1, 1, [
          Math.min(dataUnit[0], lastDataUnit[0]),
          Math.max(dataUnit[1], lastDataUnit[1]),
        ])
        lastDataUnit = newData[newData.length - 1]
      }
    }

    this.data = newData
  }
}

export const charset = (...inputs: CharsetInput[]) => new Charset(...inputs)

function charCode(char: string) {
  if (char.length !== 1) {
    const display = `${char.length} (${JSON.stringify(char)})`
    throw new Error(`Expected length = 1, but received ${display}.`)
  }
  return char.charCodeAt(0)
}

function normalize(rawInput: CharsetRawInput) {
  if (typeof rawInput === 'number' && (rawInput < 0 || rawInput > 0x10ffff)) {
    throw new Error(
      `Invalid unicode code point detected: ${
        rawInput < 0 ? rawInput : `0x${rawInput.toString(16)}`
      }`,
    )
  }
  const [normalized] = [rawInput]
    .map(_ => (typeof _ !== 'object' ? [_, _] : _))
    .map(_ => _.map(u => (typeof u === 'string' ? charCode(u) : u)))
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

function rangesToString(ranges: CharsetDataUnit[], flags: string = '') {
  if (flags.includes('u')) {
    return normalToPattern(ranges, true)
  }

  const { normal, surrogate } = splitRanges(ranges)

  const patterns: string[] = []

  if (normal.length !== 0) {
    patterns.push(normalToPattern(normal, false))
  }

  patterns.push(...surrogateToPatterns(surrogate))

  return patterns.join('|')
}

function normalToPattern(normal: CharsetDataUnit[], hasUnicodeFlag: boolean) {
  const ranges = normal.map(([start, end]) =>
    start === end
      ? unicode(start, hasUnicodeFlag)
      : `${unicode(start, hasUnicodeFlag)}-${unicode(end, hasUnicodeFlag)}`,
  )
  return `[${ranges.join('')}]`
}

function surrogateToPatterns(surrogate: Surrogate) {
  const patterns: string[] = []

  if (surrogate.entire.data.length !== 0) {
    const h = surrogate.entire.toString()
    const l = `[${[SurrogateLimit.MinL, SurrogateLimit.MaxL]
      .map(_ => unicode(_, false))
      .join('-')}]`
    patterns.push(`${h}${l}`)
  }

  for (const { h: rawH, l: lCharset } of surrogate.partial) {
    const h = unicode(rawH, false)
    const l = lCharset.toString()
    patterns.push(`${h}${l}`)
  }

  return patterns
}

function splitRanges(data: CharsetDataUnit[]) {
  const normal: CharsetDataUnit[] = []
  const surrogateRanges: CharsetDataUnit[] = []

  for (let i = 0; i < data.length; i++) {
    const dataUnit = data[i]
    const [start, end] = dataUnit

    if (start >= SurrogateLimit.Min) {
      surrogateRanges.push(...data.slice(i))
      break
    }

    if (end >= SurrogateLimit.Min) {
      normal.push([start, SurrogateLimit.Min - 1])
      surrogateRanges.push([0x10000, end], ...data.slice(i + 1))
      break
    }

    normal.push(dataUnit)
  }

  return { normal, surrogate: splitSurrogateRanges(surrogateRanges) }
}

function splitSurrogateRanges(ranges: CharsetDataUnit[]) {
  interface SurrogateData {
    h: number
    l: CharsetDataUnit[]
  }

  const entire: number[] = []
  const partial: SurrogateData[] = []

  for (const [start, end] of ranges) {
    const startPair = surrogatePair(start)
    const endPair = surrogatePair(end)

    if (startPair.h === endPair.h) {
      addPartialRange(startPair.h, startPair.l, endPair.l)
      continue
    }

    if (startPair.l === SurrogateLimit.MinL) {
      addEntireRange(startPair.h)
    } else {
      addPartialRange(startPair.h, startPair.l, SurrogateLimit.MaxL)
    }

    for (let h = startPair.h + 1; h < endPair.h; h++) {
      addEntireRange(h)
    }

    if (endPair.l === SurrogateLimit.MaxL) {
      addEntireRange(endPair.h)
    } else {
      addPartialRange(endPair.h, SurrogateLimit.MinL, endPair.l)
    }
  }

  return {
    entire: new Charset(...entire),
    partial: partial.map(({ h, l }) => ({ h, l: new Charset(...l) })),
  }

  function addEntireRange(h: number) {
    entire.push(h)
  }

  function addPartialRange(h: number, start: number, end: number) {
    const lastPartial = partial[partial.length - 1] as undefined | SurrogateData
    if (lastPartial !== undefined && lastPartial.h === h) {
      lastPartial.l.push([start, end])
    } else {
      partial.push({ h, l: [[start, end]] })
    }
  }
}

// https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
function surrogatePair(codepoint: number) {
  return {
    h: Math.floor((codepoint - 0x10000) / 0x400) + 0xd800,
    l: ((codepoint - 0x10000) % 0x400) + 0xdc00,
  }
}

function unicode(char: number, hasUnicodeFlag: boolean) {
  const hex = char.toString(16)
  return hasUnicodeFlag
    ? `\\u{${hex}}`
    : `\\u${'0'.repeat(4 - hex.length)}${hex}`
}
