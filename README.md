# regexp-util

<!--
TODO(public)
[![npm](https://img.shields.io/npm/v/regexp-util.svg)](https://www.npmjs.com/package/regexp-util)
[![build](https://img.shields.io/travis/ikatyang/regexp-util/master.svg)](https://travis-ci.org/ikatyang/regexp-util/builds)
[![coverage](https://img.shields.io/codecov/c/github/ikatyang/regexp-util/master.svg)](https://codecov.io/gh/ikatyang/regexp-util)
-->

utilities for generating regular expression

[Changelog](https://github.com/ikatyang/regexp-util/blob/master/CHANGELOG.md)

## Install

```sh
# using npm
npm install --save regexp-util

# using yarn
yarn add regexp-util
```

## Usage

```ts
const util = require('regexp-util');

const regex = util.charset(['a', 'g']) // a ~ g
  .subtract(['c', 'e'])
  .toRegExp();

const aResult = 'a'.test(regex); //=> true
const dResult = 'd'.test(regex); //=> false
```

NOTE: You need to pass [`u` flag](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/unicode) for codepoint that is greater than `0xffff`.

## Development

```sh
# lint
yarn run lint

# build
yarn run build

# test
yarn run test
```

## License

MIT © [Ika](https://github.com/ikatyang)
