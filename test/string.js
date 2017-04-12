'use strict';

const test = require('tape');

test('Strings', (t) => {
	const { object, string } = require('..');

	function schema(optional, defaultValue, conditions = {}) {
		const s = string();

		if (optional) {
			s.optional();
		}

		if (defaultValue !== null && defaultValue !== undefined) {
			s.default(defaultValue);
		}

		if (conditions.hasOwnProperty('min')) {
			s.min(conditions.min, 'tooShort');
		}

		if (conditions.hasOwnProperty('max')) {
			s.max(conditions.max, 'tooLong');
		}

		if (conditions.hasOwnProperty('length')) {
			s.length(conditions.length[0], conditions.length[1], 'badLength');
		}

		if (conditions.hasOwnProperty('values')) {
			s.values(conditions.values);
		}

		if (conditions.hasOwnProperty('regexp')) {
			s.regexp(conditions.regexp, 'regexpMismatch');
		}

		return object({ s });
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

	// optional

	t.deepEqual(schema(true).create({}), { s: undefined });
	t.throws(() => { schema(false).create({}); });

	// default

	t.deepEqual(schema(true, 'str').create({}), { s: 'str' });
	t.deepEqual(schema(true, 'foo').create({ s: 'str' }), { s: 'str' });
	t.throws(() => { schema(true, 5).create({}); });
	t.throws(() => { schema(true, {}).create({}); });

	// min

	t.throws(() => { schema(false, null, { min: 0.5 }); });
	throwsCode('tooShort', () => { schema(false, null, { min: 5 }).create({ s: 'str' }); });

	// max

	t.throws(() => { schema(false, null, { max: 0.5 }); });
	throwsCode('tooLong', () => { schema(false, null, { max: 2 }).create({ s: 'str' }); });

	// length

	t.deepEqual(schema(false, null, { length: [0, 10] }).create({ s: 'str' }), { s: 'str' });
	t.deepEqual(schema(false, null, { length: [0, 0] }).create({ s: '' }), { s: '' });
	t.deepEqual(schema(false, null, { length: [1, 2] }).create({ s: 's' }), { s: 's' });
	t.deepEqual(schema(false, null, { length: [1, 2] }).create({ s: 'st' }), { s: 'st' });
	t.throws(() => { schema(false, null, { length: [-Infinity, 10] }); });
	t.deepEqual(schema(false, null, { length: [null, 10] }).create({ s: 'st' }), { s: 'st' });
	t.deepEqual(schema(false, null, { length: [undefined, 10] }).create({ s: 'st' }), { s: 'st' });
	t.deepEqual(schema(false, null, { length: [1, Infinity] }).create({ s: 'st' }), { s: 'st' });
	t.deepEqual(schema(false, null, { length: [1, null] }).create({ s: 'st' }), { s: 'st' });
	t.deepEqual(schema(false, null, { length: [1, undefined] }).create({ s: 'st' }), { s: 'st' });
	t.throws(() => { schema(false, null, { length: [1, 2] }).create({ s: 'str' }); });
	t.throws(() => { schema(false, null, { length: [1, 2] }).create({ s: '' }); });
	t.throws(() => { schema(false, null, { length: [0.5, 1] }); });
	t.throws(() => { schema(false, null, { length: [0, 1.5] }); });

	// values

	t.deepEqual(schema(false, null, { values: ['a', 'b', 'c'] }).create({ s: 'b' }), { s: 'b' });
	t.throws(() => { schema(false, null, { values: ['a', 'b'] }).create({ s: 'str' }); });
	t.throws(() => { schema(false, null, { values: 'str' }); });
	t.throws(() => { schema(false, null, { values: [] }); });
	t.throws(() => { schema(false, null, { values: [5] }); });
	t.throws(() => { schema(false, null, { values: [5.5] }); });
	t.throws(() => { schema(false, null, { values: [false, true] }); });
	t.throws(() => { schema(false, null, { values: [{}] }); });

	// regexp

	t.deepEqual(schema(false, null, { regexp: /^[a-z]+$/ }).create({ s: 'str' }), { s: 'str' });
	throwsCode('regexpMismatch', () => { schema(false, null, { regexp: /^[A-Z]+$/ }).create({ s: 'str' }); });
	t.throws(() => { schema(false, null, { regexp: 'str' }); });

	// type

	t.throws(() => { schema(false).create({ s: 5 }); });
	t.throws(() => { schema(false).create({ s: 5.5 }); });
	t.throws(() => { schema(false).create({ s: true }); });
	t.throws(() => { schema(false).create({ s: {} }); });

	t.end();
});
