import { test, expect } from 'vitest'
import { Base } from './base.js'

class Test extends Base {
  constructor(public data: string) {
    super()
  }
  protected _isEmpty() {
    return this.data.length === 0
  }
  protected _toString() {
    return this.data
  }
}

test('toRegExp: default', () => {
  expect(new Test('123').toRegExp()).toMatchSnapshot()
})

test('toRegExp: accept flags', () => {
  expect(new Test('123').toRegExp('i')).toMatchSnapshot()
})

test('toString: throw error if empty', () => {
  expect(() => new Test('').toString()).toThrowErrorMatchingSnapshot()
})
