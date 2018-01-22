import { or } from './or';

test('create: accept string', () => {
  expect(or('hello', 'world').toString()).toEqual('(?:hello|world)');
});

test('create: accept charset inputs', () => {
  expect(or('a', [1, 3]).toString()).toEqual('(?:[\\u{1}-\\u{3}\\u{61}])');
});

test('union', () => {
  expect(
    or('hello', 'world', [5, 9])
      .union([3, 7])
      .toString(),
  ).toEqual('(?:[\\u{3}-\\u{9}]|hello|world)');
});
