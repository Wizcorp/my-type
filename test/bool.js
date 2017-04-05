'use strict';

const test = require('tape');

test('Booleans', function (t) {
	const { object, bool } = require('..');

	function schema(optional, defaultValue, values) {
		const b = bool('notBool');

		if (optional) {
			b.optional();
		}

		if (defaultValue !== null && defaultValue !== undefined) {
			b.default(defaultValue);
		}

		if (values) {
			b.values(values, 'badValue');
		}

		return object({ b });
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

	t.deepEqual(schema(true).create({}), { b: undefined });
	t.throws(() => { schema(false).create({}); });

	// default

	t.deepEqual(schema(true, true).create({}), { b: true });
	t.deepEqual(schema(true, true).create({ b: false }), { b: false });
	t.throws(() => { schema(true, 'str').create({}); });

	// values

	t.deepEqual(schema(false, null, [true]).create({ b: true }), { b: true });
	throwsCode('badValue', () => { schema(false, null, [false]).create({ b: true }); });
	t.throws(() => { schema(false, null, 'str'); });
	t.throws(() => { schema(false, null, []); });
	t.throws(() => { schema(false, null, ['str']); });
	t.throws(() => { schema(false, null, [5]); });
	t.throws(() => { schema(false, null, [5.5]); });
	t.throws(() => { schema(false, null, [{}]); });

	// type

	throwsCode('notBool', () => { schema(false).create({ b: 5 }); });
	throwsCode('notBool', () => { schema(false).create({ b: 5.5 }); });
	throwsCode('notBool', () => { schema(false).create({ b: 'str' }); });
	throwsCode('notBool', () => { schema(false).create({ b: {} }); });

	t.end();
});
