'use strict';

const test = require('tape');

test('Numbers', function (t) {
	const { object, number } = require('..');

	function schema(optional, defaultValue, range, values) {
		const n = number('notNumber');

		if (optional) {
			n.optional();
		}

		if (defaultValue !== null && defaultValue !== undefined) {
			n.default(defaultValue);
		}

		if (range) {
			n.range(range[0], range[1], 'outOfRange');
		}

		if (values) {
			n.values(values, 'badValue');
		}

		return object({ n });
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

	t.deepEqual(schema(true).create({}), { n: undefined });
	t.throws(() => { schema(false).create({}); });

	// default

	t.deepEqual(schema(true, 5).create({}), { n: 5 });
	t.deepEqual(schema(true, 1).create({ n: 5 }), { n: 5 });
	t.throws(() => { schema(true, 'str').create({}); });
	t.throws(() => { schema(true, {}).create({}); });

	// range

	t.deepEqual(schema(false, null, [0, 10]).create({ n: 0 }), { n: 0 });
	t.deepEqual(schema(false, null, [0, 10]).create({ n: 5 }), { n: 5 });
	t.deepEqual(schema(false, null, [0, 10]).create({ n: 10 }), { n: 10 });
	throwsCode('outOfRange', () => { schema(false, null, [0, 1]).create({ n: -1 }); });
	throwsCode('outOfRange', () => { schema(false, null, [0, 1]).create({ n: 2 }); });
	throwsCode('outOfRange', () => { schema(false, null, [0, 1]).create({ n: 5 }); });
	t.throws(() => { schema(false, null, [true, 1]); });
	t.throws(() => { schema(false, null, [0, true]); });

	// values

	t.deepEqual(schema(false, null, null, [1, 3, 5]).create({ n: 5 }), { n: 5 });
	throwsCode('badValue', () => { schema(false, null, null, [0, 1]).create({ n: 5 }); });
	t.throws(() => { schema(false, null, null, 'str'); });
	t.throws(() => { schema(false, null, null, []); });
	t.throws(() => { schema(false, null, null, ['str']); });
	t.throws(() => { schema(false, null, null, [false, true]); });
	t.throws(() => { schema(false, null, null, [{}]); });

	// type

	throwsCode('notNumber', () => { schema(false).create({ n: 'str' }); });
	throwsCode('notNumber', () => { schema(false).create({ n: true }); });
	throwsCode('notNumber', () => { schema(false).create({ n: {} }); });
	throwsCode('notNumber', () => { schema(false).create({ n: NaN }); });

	t.end();
});
