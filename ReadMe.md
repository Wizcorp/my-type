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

* `string([code]);`: creates a **string** type with an error code for type violations
* `number([code]);`: creates a **number** type with an error code for type violations
* `int([code]);`: creates an **integer** type with an error code for type violations
* `bool([code]);`: creates a **boolean** type with an error code for type violations
* `mixed(types);`: creates a type that represents **any one of the given types**
* `any();`: creates a **wildcard** type
* `array(type, [code]);`: creates an **array** type with children of a given type and an error code for type violations
* `object(props, [code]);`: creates an **object** type with properties of given types and an error code for type violations

### Default values (all types, except object)

You can set up all types to have a default value.

* `string().default('Hello world');`: creates a string type with a default value

If you want an object to be created according to a default format, simply set the
defaults on its properties.

### Set up a type to be optional (all types)

* `string().optional();`: creates a string type that does not have to be set (ie: undefined and null are allowed)

### Constraints

* `string().length(min, max, [code])`: creates a string type with a min/max length
* `string().regexp(regexp, [code]);`: creates a string type with a regular expression constraint
* `string().values(values, [code])`: creates a string type with a limited set of allowed values
* `number().range(min, max, [code])`: creates a number type with a min/max value
* `number().values(values, [code])`: creates a number type with a limited set of allowed values
* `int().range(min, max, [code])`: creates an integer type with a min/max value
* `int().values(values, [code])`: creates an integer type with a limited set of allowed values
* `bool().values(values, [code])`: creates a boolean type with a limited set of allowed values
* `array(type).length(min, max, [code])`: creates an array type with a min/max length

Every constraint function accepts an extra optional `code` argument. When the constraint is violated, this code will be
available on your error object as `error.code`. Use either strings or numbers.

For `length` and `range` constraints, you can use `-Infinity` or `Infinity` to indicate that there is
no limit on the lower or upper end.

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


## License

MIT
