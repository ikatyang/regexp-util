import { test, expect } from 'vitest'
import { or } from './or.js'

test('create: accept string', () => {
  expect(or('hello', 'world').toString()).toMatchSnapshot()
})

test('create: accept charset inputs', () => {
  expect(or('a', [1, 3]).toString()).toMatchSnapshot()
})

test('create: accept or', () => {
  expect(or('a', [1, 3], or('c', 'd')).toString()).toMatchSnapshot()
})

test('create: special chars are considered string', () => {
  expect(or('a', '^', '$').toString()).toMatchSnapshot()
})

test('union', () => {
  expect(
    or('hello', 'world', [5, 9]).union([3, 7]).toString(),
  ).toMatchSnapshot()
})

test('subtract: default', () => {
  expect(
    or('hello', 'world', [1, 7], 'foo', 'bar')
      .subtract('world', [3, 5], or('bar', 'baz'))
      .toString(),
  ).toMatchSnapshot()
})

test('subtract: special chars are considered string', () => {
  expect(or('a', '^', '$').subtract('^').toString()).toMatchSnapshot()
})
