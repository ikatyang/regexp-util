import { test, expect } from 'vitest'
import { charset } from './charset.js'

test('create: accept char', () => {
  expect(charset('0').toString()).toEqual('[\\u0030]')
})

test('create: accept number', () => {
  expect(charset(0).toString()).toEqual('[\\u0000]')
})

test('create: accept char range', () => {
  expect(charset(['0', '9']).toString()).toEqual('[\\u0030-\\u0039]')
})

test('create: accept number range', () => {
  expect(charset([0, 9]).toString()).toEqual('[\\u0000-\\u0009]')
})

test('create: accept charset', () => {
  expect(charset(charset(0, 9)).toString()).toEqual('[\\u0000\\u0009]')
})

test('create: reject string (length !== 1)', () => {
  expect(() => charset('123')).toThrowErrorMatchingSnapshot()
})

test('create: reject invalid unicode code point', () => {
  expect(() => charset(0x110000)).toThrowErrorMatchingSnapshot()
  expect(() => charset(-1)).toThrowErrorMatchingSnapshot()
})

test('create: collapse continous chars', () => {
  expect(charset(1, 2, 3, 4).toString()).toEqual('[\\u0001-\\u0004]')
})

test('create: collapse intersecting ranges', () => {
  expect(charset([2, 5], [4, 8]).toString()).toEqual('[\\u0002-\\u0008]')
})

test('create: order does not matter', () => {
  expect(charset(1, 5, 3, 7).toString()).toEqual(
    '[\\u0001\\u0003\\u0005\\u0007]',
  )
})

test('union', () => {
  expect(charset(1).union(3).toString()).toEqual('[\\u0001\\u0003]')
})

test('union: central overlap', () => {
  expect(charset([0x5b, 0x60]).union([0x5c, 0x5d]).toString()).toEqual(
    `[\\u005b-\\u0060]`,
  )
})

test('subtract: front + no overlap', () => {
  expect(charset([5, 7]).subtract([1, 3]).toString()).toEqual(
    `[\\u0005-\\u0007]`,
  )
})

test('subtract: back + no overlap', () => {
  expect(charset([1, 3]).subtract([5, 7]).toString()).toEqual(
    `[\\u0001-\\u0003]`,
  )
})

test('subtract: front overlap', () => {
  expect(charset([3, 7]).subtract([1, 5]).toString()).toEqual(
    `[\\u0006-\\u0007]`,
  )
})

test('subtract: exact front overlap', () => {
  expect(charset([3, 7]).subtract([3, 5]).toString()).toEqual(
    `[\\u0006-\\u0007]`,
  )
})

test('subtract: central overlap', () => {
  expect(charset([1, 7]).subtract([3, 5]).toString()).toEqual(
    `[\\u0001-\\u0002\\u0006-\\u0007]`,
  )
})

test('subtract: multi central overlap', () => {
  expect(charset([1, 7]).subtract([2, 3], [5, 6]).toString()).toEqual(
    `[\\u0001\\u0004\\u0007]`,
  )
})

test('subtract: back overlap', () => {
  expect(charset([1, 5]).subtract([3, 7]).toString()).toEqual(
    `[\\u0001-\\u0002]`,
  )
})

test('subtract: exact back overlap', () => {
  expect(charset([1, 5]).subtract([3, 5]).toString()).toEqual(
    `[\\u0001-\\u0002]`,
  )
})

test('subtract: entire overlap', () => {
  expect(charset([3, 5]).subtract([1, 7]).data.length).toEqual(0)
})

test('subtract: mixed', () => {
  expect(charset([1, 2], [5, 6], [8, 9]).subtract([2, 8]).toString()).toEqual(
    `[\\u0001\\u0009]`,
  )
})

test('intersect', () => {
  expect(charset([1, 5]).intersect([3, 7]).toString()).toEqual(
    `[\\u0003-\\u0005]`,
  )
})

test('toString: normal syntax for <= 0xffff', () => {
  expect(charset(0xffff).toString()).toEqual(`[\\uffff]`)
})

test('toString: surrogate pair for > 0xffff', () => {
  expect(charset(0x10000).toString()).toEqual(`\\ud800[\\udc00]`)
  expect(charset([0, 0x10000]).toString()).toEqual(
    `[\\u0000-\\uffff]|\\ud800[\\udc00]`,
  )
  expect(charset(0x10000, 0x10002).toString()).toEqual(
    `\\ud800[\\udc00\\udc02]`,
  )
  expect(charset([0x10001, 0x10fffe]).toString()).toEqual(
    `[\\ud801-\\udbfe][\\udc00-\\udfff]|\\ud800[\\udc01-\\udfff]|\\udbff[\\udc00-\\udffe]`,
  )
  expect(charset([0, 0x10ffff]).toString()).toEqual(
    `[\\u0000-\\uffff]|[\\ud800-\\udbff][\\udc00-\\udfff]`,
  )
})

test('toRegExp: codepoint > 0xffff should not throw error without u-flag', () => {
  expect(() => charset(0x10000).toRegExp()).not.toThrowError()
})
