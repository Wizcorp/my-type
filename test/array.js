'use strict';

const test = require('tape');

test('Arrays', function (t) {
	const { object, array, string } = require('..');

	function schema(optional, defaultValue, length) {
		const a = array(string('notString'), 'notArray');

		if (optional) {
			a.optional();
		}

		if (defaultValue !== null && defaultValue !== undefined) {
			a.default(defaultValue);
		}

		if (length) {
			a.length(length[0], length[1], 'badLength');
		}

		return object({ a });
	}

	function throwsCode(code, fn) {
		let error;

		try {
			fn();
		} catch (err) {
			error = err;
		}

		if (error) {
			t.equal(error.code, code);
		} else {
			t.fail('Expected function to throw: ' + fn);
		}
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
	throwsCode('badLength', () => { schema(false, null, [0, 1]).create({ a: ['a', 'b', 'c'] }); });

	// type

	throwsCode('notArray', () => { schema(false).create({ a: 'str' }); });
	throwsCode('notString', () => { schema(false).create({ a: [123] }); });

	t.end();
});
