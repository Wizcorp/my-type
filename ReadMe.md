[![Build Status](https://travis-ci.org/Wizcorp/my-type.svg?branch=master)](https://travis-ci.org/Wizcorp/my-type)
[![Coverage Status](https://coveralls.io/repos/github/Wizcorp/my-type/badge.svg?branch=master)](https://coveralls.io/github/Wizcorp/my-type?branch=master)

# My Type

A minimalistic JavaScript type checker and object creation library.


## Installation

```sh
npm install --save my-type
```


## This module is really my type

There are many JS(ON) schema validators out there. I don't really like any of them (although there are so many, I've
not possibly seen all of them, I must admit). This one is a bit different in a few key areas:

- A modern API designed for ES6 users.
- A tiny API that achieves the same as the crazy verbose ones.
- Object creation based on the schema and its default values.
- Very verbose exceptions (major time saver during development).
- High performance assertions.


## Example

Let's start with a simple example to sell you the idea.

```js
const { object, array, string, number, int, bool, mixed, any } = require('my-type');

const userIdType = string().regexp(/^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$/, 'notUUID');

const user = object({
	id:            userIdType,
	name:          string().length(3, 50),
	age:           int().range(18, 150).optional(),
	sex:           string().values(['M', 'F']),
	isBanned:      bool().default(false),
	score:         number().default(0).range(0, 100),
	foobar:        mixed([number(), string()]),
	lastSeenUsers: array(userIdType).length(0, 5)
});

var bob = user.create({ id: uuid(), name: 'Bob', sex: 'M', foobar: 3, lastSeenUsers: [] });
```


## A modern API

The API is exposed in a way that only really makes sense when you use destructuring. For each supported data type, there
is exactly one function, which you can pull off the module.

Example:

```js
const { string, number, int, bool, mixed, any, array, object } = require('my-type');
```

### Type creation

* `string([code])`: creates a **string** type with an error code for type violations
* `number([code])`: creates a **number** type with an error code for type violations
* `int([code])`: creates an **integer** type with an error code for type violations
* `bool([code])`: creates a **boolean** type with an error code for type violations
* `mixed(types)`: creates a type that represents **any one of the given types**
* `any()`: creates a **wildcard** type
* `array(type, [code])`: creates an **array** type with children of a given type and an error code for type violations
* `object(props, [code])`: creates an **object** type with properties of given types and an error code for type violations

### Default values (all types, except object)

You can set up all types to have a default value.

* `string().default('Hello world')`: creates a string type with a default value
* `int().default(Date.now)`: creates an int type with a default value that is always the current time

If you want an object to be created according to a default format, simply set the
defaults on its properties.

### Set up a type to be optional (all types)

* `string().optional()`: creates a string type that does not have to be set (ie: undefined and null are allowed)

### Constraints

* `string().min(min, [code])`: creates a string type with a minimum length
* `string().max(max, [code])`: creates a string type with a maximum length
* `string().length(min, max, [code])`: creates a string type with a min/max length
* `string().regexp(regexp, [code])`: creates a string type with a regular expression constraint
* `string().values(values, [code])`: creates a string type with a limited set of allowed values
* `number().min(min, [code])`: creates a number type with a minimum value
* `number().max(max, [code])`: creates a number type with a maximum value
* `number().range(min, max, [code])`: creates a number type with a min/max value
* `number().values(values, [code])`: creates a number type with a limited set of allowed values
* `int().min(min, [code])`: creates an integer type with a minimum value
* `int().max(max, [code])`: creates an integer type with a maximum value
* `int().range(min, max, [code])`: creates an integer type with a min/max value
* `int().values(values, [code])`: creates an integer type with a limited set of allowed values
* `bool().values(values, [code])`: creates a boolean type with a limited set of allowed values
* `array(type).min(min, [code])`: creates an array type with a minimum length
* `array(type).max(max, [code])`: creates an array type with a maximum length
* `array(type).length(min, max, [code])`: creates an array type with a min/max length
* `object(props).dictionary(keyType, valueType)`: creates an object that allows keys by any name, but with strict key and value types
* `object(props).min(min, [code])`: creates an object with a minimum number of properties (for dictionaries)
* `object(props).max(max, [code])`: creates an object with a maximum number of properties (for dictionaries)
* `object(props).length(min, max, [code])`: creates an object with a min/max number of properties (for dictionaries)

Every constraint function accepts an extra optional `code` argument. When the constraint is violated, this code will be
available on your error object as `error.code`. Use either strings or numbers.

For `length` and `range` constraints, you can use `-Infinity` or `Infinity` to indicate that there is
no limit on the lower or upper end. Alternatively, you can pass `null` or `undefined`.

Default, Optional and Constraints can be chained in any order:

```js
string().default('Hello world').length(1, 50);
number().range(0, 1).default(0);
string().length(3, 10).optional();
```

### Arrays

```js
array(number());    // array of numbers
```

### Objects

```js
object({
	id: int(),
	name: string(),
	foo: bool(),
	bar: array(number())
});
```

### Dictionaries:

```js
object({
	_version: int()
}).dictionary(string(), mixed([number(), string()]));
```

## Creating and updating objects

Once you have set up a schema, you can easily use it as a template for new objects. Remember that as long as you use
`my-type`, all properties will always be checked against the schema.

Given a schema:

```js
const user = object({
	id: int(),
	name: string().default('Anonymous'),
	isBanned: bool().default(false),
	lastLogin: int().optional()
});
```

### Object instance creation

```js
const myDefaultUser = user.create({ id: 1 });

// myDefaultUser: {
//   id: 1,
//   name: 'Anonymous',
//   isBanned: false,
//   lastLogin: undefined
// }
```

### Safe object updates

```js
user.update(myDefaultUser, { name: 'Bob' });

// myDefaultUser: {
//   id: 1,
//   name: 'Bob',
//   isBanned: false,
//   lastLogin: undefined
// }
```

Please note that if an update causes an assertion to fail, the source object that was passed to `update()` will
be in a broken state. For performance and memory reasons, assertions happen during the update cycle, not before.

### Schema assertion after unsafe object updates

Alternatively, you can change objects manually, and assert their correctness using the `schema.assert(obj)` API.

```js
myDefaultUser.name = 'Bob';
user.assert(myDefaultUser);

// myDefaultUser: {
//   id: 1,
//   name: 'Bob',
//   isBanned: false,
//   lastLogin: undefined
// }
```

## Error handling

Whenever an error occurs, an exception will be thrown. The exception is an instance of `require('my-type').MyTypeError`.
The error message already provides as much information as possible. For example, when a type didn't match, the expected
type and the found type will both be shown. When length or range assertions failed, both the expectation and actual
values will be shown.

You can access the following properties on these error objects:

As is usual on Error objects:

- message: The message string.
- stack: The stack trace.

And additionally:

- value: The value that broke the assertion rules.
- code: The code that was registered with the type or the constraint (or `undefined` if none was provided).


## Error code extraction

If you want to populate a list of possible error codes from your code base, you can easily do this in the following
formats:

* ascii: Human readable, pretty printed and aligned ascii output.
* csv: CSV output using double quotes to wrap fields, commas to separate them and including a single header-row.
* js: An array of JS objects that contain all the information.

Example:

```js
const { object, array, string, number, int, describe } = require('my-type');

const actor = object({
	id:     int().min(1, 'badId'),
	name:   string().min(3, 'nameTooShort'),
	birthday: string().regexp(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/, 'badBirthday')
});

const movie = object({
	id:        int().min(1, 'badId'),
	name:      string().length(3, 100, 'badNameLength'),
	year:      int().range(1900, (new Date).getFullYear(), 'badYear'),
	rating:    number().optional().range(0, 1, 'badPercentage'),
	actors:    array(actor)
});

const options = {
	delimiter: ',',                      // delimiter when using CSV output (default: ",")
	skipHeader: false,                   // skips the header if true (default: false)
	filter: (entry) => { return true; }, // skips each entry for which filter returns false
	transform: (entry) => {}             // allows modification of the entry before serialization
};

console.log(describe(movie, 'ascii', ['path', 'code', 'message'], options));
```

Output:

```
+---------------------------------------------------------------------------------------------------------------------+
| path                   | code          | message                                                                    |
+---------------------------------------------------------------------------------------------------------------------+
|                        |               | Value is not optional                                                      |
|                        |               | Value is not an object (found: %type)                                      |
| id                     |               | id is not optional                                                         |
| id                     |               | id is not an integer (found: %type)                                        |
| id                     | badId         | id must be >= 1 (found: %value)                                            |
| name                   |               | name is not optional                                                       |
| name                   |               | name is not a string (found: %type)                                        |
| name                   | badNameLength | name string length must be >= 3 (found: %length)                           |
| name                   | badNameLength | name string length must be <= 100 (found: %length)                         |
| year                   |               | year is not optional                                                       |
| year                   |               | year is not an integer (found: %type)                                      |
| year                   | badYear       | year must be >= 1900 (found: %value)                                       |
| year                   | badYear       | year must be <= 2017 (found: %value)                                       |
| rating                 |               | rating is not a number (found: %type))                                     |
| rating                 |               | rating is NaN                                                              |
| rating                 | badPercentage | rating must be >= 0 (found: %value)                                        |
| rating                 | badPercentage | rating must be <= 1 (found: %value)                                        |
| actors                 |               | actors is not optional                                                     |
| actors                 |               | actors is not an array (found: %type)                                      |
| actors[index]          |               | actors[index] is not optional                                              |
| actors[index]          |               | actors[index] is not an object (found: %type)                              |
| actors[index].id       |               | id is not optional                                                         |
| actors[index].id       |               | id is not an integer (found: %type)                                        |
| actors[index].id       | badId         | id must be >= 1 (found: %value)                                            |
| actors[index].name     |               | name is not optional                                                       |
| actors[index].name     |               | name is not a string (found: %type)                                        |
| actors[index].name     | nameTooShort  | name string length must be >= 3 (found: %length)                           |
| actors[index].birthday |               | birthday is not optional                                                   |
| actors[index].birthday |               | birthday is not a string (found: %type)                                    |
| actors[index].birthday | badBirthday   | birthday does not match regular expression: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/ |
+---------------------------------------------------------------------------------------------------------------------+
```

## License

MIT
