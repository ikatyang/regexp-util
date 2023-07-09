import { test, expect } from 'vitest'
import { charset } from '../src/index.js'

test('example', () => {
  const regex = charset(['a', 'g']).subtract(['c', 'e']).toRegExp()
  expect(regex.test('a')).toBe(true)
  expect(regex.test('d')).toBe(false)
})
