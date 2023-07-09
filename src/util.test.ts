import { test, expect } from 'vitest'
import { concat, optional, repeat, wrap } from './util.js'

test('wrap: accept char', () => {
  expect(wrap('a')).toMatchSnapshot()
})

test('wrap: accept string', () => {
  expect(wrap('abc')).toMatchSnapshot()
})

test('concat', () => {
  expect(concat('hello', 'world')).toMatchSnapshot()
})

test('optional', () => {
  expect(optional('abc')).toMatchSnapshot()
})

test('repeat: count', () => {
  expect(repeat('abc', 1)).toMatchSnapshot()
})

test('repeat: count, max != Infinity', () => {
  expect(repeat('abc', 1, 2)).toMatchSnapshot()
})

test('repeat: count = 0, max = Infinity', () => {
  expect(repeat('abc', 0, Infinity)).toMatchSnapshot()
})

test('repeat: count = 1, max = Infinity', () => {
  expect(repeat('abc', 1, Infinity)).toMatchSnapshot()
})

test('repeat: count > 1, max = Infinity', () => {
  expect(repeat('abc', 2, Infinity)).toMatchSnapshot()
})
