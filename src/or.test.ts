import { or } from './or';

test('create: accept string', () => {
  expect(or('hello', 'world').toString()).toMatchSnapshot();
});

test('create: accept charset inputs', () => {
  expect(or('a', [1, 3]).toString()).toMatchSnapshot();
});

test('union', () => {
  expect(
    or('hello', 'world', [5, 9])
      .union([3, 7])
      .toString(),
  ).toMatchSnapshot();
});
