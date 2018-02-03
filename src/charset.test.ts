import { charset } from './charset';

test('create: accept char', () => {
  expect(charset('0').toString()).toEqual('[\\u{30}]');
});

test('create: accept number', () => {
  expect(charset(0).toString()).toEqual('[\\u{0}]');
});

test('create: accept char range', () => {
  expect(charset(['0', '9']).toString()).toEqual('[\\u{30}-\\u{39}]');
});

test('create: accept number range', () => {
  expect(charset([0, 9]).toString()).toEqual('[\\u{0}-\\u{9}]');
});

test('create: accept charset', () => {
  expect(charset(charset(0, 9)).toString()).toEqual('[\\u{0}\\u{9}]');
});

test('create: reject string (length !== 1)', () => {
  expect(() => charset('123')).toThrowErrorMatchingSnapshot();
});

test('create: collapse continous chars', () => {
  expect(charset(1, 2, 3, 4).toString()).toEqual('[\\u{1}-\\u{4}]');
});

test('create: collapse intersecting ranges', () => {
  expect(charset([2, 5], [4, 8]).toString()).toEqual('[\\u{2}-\\u{8}]');
});

test('create: order does not matter', () => {
  expect(charset(1, 5, 3, 7).toString()).toEqual('[\\u{1}\\u{3}\\u{5}\\u{7}]');
});

test('union', () => {
  expect(
    charset(1)
      .union(3)
      .toString(),
  ).toEqual('[\\u{1}\\u{3}]');
});

test('subtract: front + no overlap', () => {
  expect(
    charset([5, 7])
      .subtract([1, 3])
      .toString(),
  ).toEqual(`[\\u{5}-\\u{7}]`);
});

test('subtract: back + no overlap', () => {
  expect(
    charset([1, 3])
      .subtract([5, 7])
      .toString(),
  ).toEqual(`[\\u{1}-\\u{3}]`);
});

test('subtract: front overlap', () => {
  expect(
    charset([3, 7])
      .subtract([1, 5])
      .toString(),
  ).toEqual(`[\\u{6}-\\u{7}]`);
});

test('subtract: exact front overlap', () => {
  expect(
    charset([3, 7])
      .subtract([3, 5])
      .toString(),
  ).toEqual(`[\\u{6}-\\u{7}]`);
});

test('subtract: central overlap', () => {
  expect(
    charset([1, 7])
      .subtract([3, 5])
      .toString(),
  ).toEqual(`[\\u{1}-\\u{2}\\u{6}-\\u{7}]`);
});

test('subtract: back overlap', () => {
  expect(
    charset([1, 5])
      .subtract([3, 7])
      .toString(),
  ).toEqual(`[\\u{1}-\\u{2}]`);
});

test('subtract: exact back overlap', () => {
  expect(
    charset([1, 5])
      .subtract([3, 5])
      .toString(),
  ).toEqual(`[\\u{1}-\\u{2}]`);
});

test('subtract: entire overlap', () => {
  expect(charset([3, 5]).subtract([1, 7]).data.length).toEqual(0);
});

test('subtract: mixed', () => {
  expect(
    charset([1, 2], [5, 6], [8, 9])
      .subtract([2, 8])
      .toString(),
  ).toEqual(`[\\u{1}\\u{9}]`);
});

test('intersect', () => {
  expect(
    charset([1, 5])
      .intersect([3, 7])
      .toString(),
  ).toEqual(`[\\u{3}-\\u{5}]`);
});
