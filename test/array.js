'use strict';

const test = require('tape');

test('Arrays', (t) => {
	const { object, array, string } = require('..');

	function schema(optional, defaultValue, conditions = {}) {
		const a = array(string('notString'), 'notArray');

		if (optional) {
			a.optional();
		}

		if (defaultValue !== null && defaultValue !== undefined) {
			a.default(defaultValue);
		}

		if (conditions.hasOwnProperty('min')) {
			a.min(conditions.min, 'tooShort');
		}

		if (conditions.hasOwnProperty('max')) {
			a.max(conditions.max, 'tooLong');
		}

		if (conditions.hasOwnProperty('length')) {
			a.length(conditions.length[0], conditions.length[1], 'badLength');
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
			t.fail(`Expected function to throw: ${fn}`);
		}
	}

	// creation

	t.throws(() => { array(123); });
	t.throws(() => { array(null); });

	// optional

	t.deepEqual(schema(true).create({}), { a: undefined });
	t.throws(() => { schema(false).create({}); });

	// default

	t.deepEqual(schema(true, ['a']).create({}), { a: ['a'] });
	t.deepEqual(schema(true, ['b']).create({ a: ['a'] }), { a: ['a'] });
	t.throws(() => { schema(true, 'str').create({}); });

	// min

	t.throws(() => { schema(false, null, { min: 0.5 }); });
	throwsCode('tooShort', () => { schema(false, null, { min: 5 }).create({ a: ['str'] }); });

	// max

	t.throws(() => { schema(false, null, { max: 0.5 }); });
	throwsCode('tooLong', () => { schema(false, null, { max: 2 }).create({ a: ['a', 'b', 'c'] }); });

	// length

	t.deepEqual(schema(false, null, { length: [0, 10] }).create({ a: ['a'] }), { a: ['a'] });
	throwsCode('badLength', () => { schema(false, null, { length: [0, 1] }).create({ a: ['a', 'b', 'c'] }); });
	throwsCode('badLength', () => { schema(false, null, { length: [2, 3] }).create({ a: ['a'] }); });
	t.throws(() => { schema(false, null, { length: [0.5, 1] }); });
	t.throws(() => { schema(false, null, { length: [0, 1.5] }); });

	// type

	throwsCode('notArray', () => { schema(false).create({ a: 'str' }); });
	throwsCode('notString', () => { schema(false).create({ a: [123] }); });

	t.end();
});
