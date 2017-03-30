'use strict';

const test = require('tape');

test('Strings', function (t) {
	const { object, string } = require('..');

	function schema(optional, defaultValue, length, values, regexp) {
		const s = string();

		if (optional) {
			s.optional();
		}

		if (defaultValue !== null && defaultValue !== undefined) {
			s.default(defaultValue);
		}

		if (length) {
			s.length(length[0], length[1]);
		}

		if (values) {
			s.values(values);
		}

		if (regexp) {
			s.regexp(regexp);
		}

		return object({ s });
	}

	// optional

	t.deepEqual(schema(true).create({}), { s: undefined });
	t.throws(() => { schema(false).create({}); });

	// default

	t.deepEqual(schema(true, 'str').create({}), { s: 'str' });
	t.deepEqual(schema(true, 'foo').create({ s: 'str' }), { s: 'str' });
	t.throws(() => { schema(true, 5).create({}); });

	// length

	t.deepEqual(schema(false, null, [0, 10]).create({ s: 'str' }), { s: 'str' });
	t.deepEqual(schema(false, null, [0, 0]).create({ s: '' }), { s: '' });
	t.deepEqual(schema(false, null, [1, 2]).create({ s: 's' }), { s: 's' });
	t.deepEqual(schema(false, null, [1, 2]).create({ s: 'st' }), { s: 'st' });
	t.throws(() => { schema(false, null, [1, 2]).create({ s: 'str' }); });
	t.throws(() => { schema(false, null, [1, 2]).create({ s: '' }); });
	t.throws(() => { schema(false, null, [0.5, 1]); });
	t.throws(() => { schema(false, null, [0, 1.5]); });

	// values

	t.deepEqual(schema(false, null, null, ['a', 'b', 'c']).create({ s: 'b' }), { s: 'b' });
	t.throws(() => { schema(false, null, null, ['a', 'b']).create({ s: 'str' }); });
	t.throws(() => { schema(false, null, null, 'str'); });
	t.throws(() => { schema(false, null, null, []); });
	t.throws(() => { schema(false, null, null, [5]); });
	t.throws(() => { schema(false, null, null, [5.5]); });
	t.throws(() => { schema(false, null, null, [false, true]); });
	t.throws(() => { schema(false, null, null, [{}]); });

	// regexp

	t.deepEqual(schema(false, null, null, null, /^[a-z]+$/).create({ s: 'str' }), { s: 'str' });
	t.throws(() => { schema(false, null, null, null, /^[A-Z]+$/).create({ s: 'str' }); });
	t.throws(() => { schema(false, null, null, null, 'str'); });

	// type

	t.throws(() => { schema(false).create({ s: 5 }); });
	t.throws(() => { schema(false).create({ s: 5.5 }); });
	t.throws(() => { schema(false).create({ s: true }); });
	t.throws(() => { schema(false).create({ s: {} }); });

	t.end();
});
