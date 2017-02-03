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

const userIdType = string().regexp(/^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$/, 'UUID');

const user = object({
	id:            userIdType,
	name:          string().length(3, 50),
	age:           int().range(18, 150).optional(),
	sex:           string().values(['M', 'F']),
	isBanned:      bool().default(false),
	score:         number().default(0).range(0, 100),
	foobar:        mixed().types([number(), string()]),
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

```js
string();       // create a string type
number();       // create a number type
int();          // create an integer type
bool();         // create a boolean type
mixed();        // create a type that is a combination of other types
any();          // create a wildcard type
array(type);    // create an array type (with children of a given type)
object(props);  // create an object type (with properties of given types)
```

### Default values (all types)

You can set up all types to have a default value

```js
string().default('Hello world');  // create a string type with a default value
```

### Set up a type to be optional (all types)

```js
string().optional();  // create a string type that does not have to be set (ie: undefined and null are allowed)
```

### Constraints

```js
string().length(min, max);       // create a string type with a min/max length
string().regexp(/^[0-9a-f]+$/i); // create a string type with a regular expression constraint
string().values(['yes', 'no']);  // create a string type with a limited set of possible values
number().range(min, max);        // create a number type with a min/max value
number().values(1, 1.5, 2);      // create a number type with a limited set of possible values
int().range(min, max);           // create an integer type with a min/max value
int().values(1, 2, 3);           // create an integer type with a limited set of possible values
bool().values([true]);           // create a boolean type with a limited set of possible values
array(type).length(min, max);    // create an array type with a min/max length
```

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

You can create instances like this:

```js
const myDefaultUser = user.create({ id: 1 });

// myDefaultUser: {
//   id: 1,
//   name: 'Anonymous',
//   isBanned: false,
//   lastLogin: undefined
// }
```

And update them like this:

```js
user.update(myDefaultUser, { name: 'Bob' });

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

- message: The message string (as is normal on Error objects)
- stack: The stack trace

And additionally:

- value: The value that broke the assertion rules.


## License

MIT
