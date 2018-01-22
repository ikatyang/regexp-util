import { Base } from './base';

class Test extends Base {
  public data = '123';
  // tslint:disable-next-line:naming-convention
  public toString() {
    return this.data;
  }
}

test('toRegExp: default', () => {
  expect(new Test().toRegExp()).toMatchSnapshot();
});

test('toRegExp: accept flags', () => {
  expect(new Test().toRegExp('u')).toMatchSnapshot();
});
