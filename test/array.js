'use strict';

const test = require('tape');

test('Arrays', function (t) {
	const { object, array, string } = require('..');

	function schema(optional, defaultValue, length) {
		const a = array(string());

		if (optional) {
			a.optional();
		}

		if (defaultValue !== null && defaultValue !== undefined) {
			a.default(defaultValue);
		}

		if (length) {
			a.length(length[0], length[1]);
		}

		return object({ a });
	}

	// optional

	t.deepEqual(schema(true).create({}), { a: undefined });
	t.throws(() => { schema(false).create({}); });

	// default

	t.deepEqual(schema(true, ['a']).create({}), { a: ['a'] });
	t.deepEqual(schema(true, ['b']).create({ a: ['a'] }), { a: ['a'] });
	t.throws(() => { schema(true, 'str').create({}); });

	// length

	t.deepEqual(schema(false, null, [0, 10]).create({ a: ['a'] }), { a: ['a'] });
	t.throws(() => { schema(false, null, [0, 1]).create({ a: ['a', 'b', 'c'] }); });

	// type

	t.throws(() => { schema(false).create({ a: 'str' }); });
	t.throws(() => { schema(false).create({ a: [123] }); });
	t.throws(() => { array(5); });

	t.end();
});
