import * as util from '../src/index';

test('example', () => {
  const regex = util
    .charset(['a', 'g'])
    .subtract(['c', 'e'])
    .toRegExp();
  expect(regex.test('a')).toBe(true);
  expect(regex.test('d')).toBe(false);
});
