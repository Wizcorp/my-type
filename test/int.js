'use strict';

const test = require('tape');

test('Integers', (t) => {
	const { object, int } = require('..');

	function schema(optional, defaultValue, conditions = {}) {
		const n = int('notInt');

		if (optional) {
			n.optional();
		}

		if (defaultValue !== null && defaultValue !== undefined) {
			n.default(defaultValue);
		}

		if (conditions.hasOwnProperty('min')) {
			n.min(conditions.min, 'tooLow');
		}

		if (conditions.hasOwnProperty('max')) {
			n.max(conditions.max, 'tooHigh');
		}

		if (conditions.hasOwnProperty('range')) {
			n.range(conditions.range[0], conditions.range[1], 'outOfRange');
		}

		if (conditions.hasOwnProperty('values')) {
			n.values(conditions.values, 'badValue');
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
			t.fail(`Expected function to throw: ${fn}`);
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

	// min

	t.throws(() => { schema(false, null, { min: 2.5 }); });
	throwsCode('tooLow', () => { schema(false, null, { min: 5 }).create({ n: 3 }); });

	// max

	t.throws(() => { schema(false, null, { max: 2.5 }); });
	throwsCode('tooHigh', () => { schema(false, null, { max: 2 }).create({ n: 3 }); });

	// range

	t.deepEqual(schema(false, null, { range: [0, 10] }).create({ n: 0 }), { n: 0 });
	t.deepEqual(schema(false, null, { range: [0, 10] }).create({ n: 5 }), { n: 5 });
	t.deepEqual(schema(false, null, { range: [0, 10] }).create({ n: 10 }), { n: 10 });
	t.deepEqual(schema(false, null, { range: [0, Infinity] }).create({ n: 0 }), { n: 0 });
	t.deepEqual(schema(false, null, { range: [0, null] }).create({ n: 0 }), { n: 0 });
	t.deepEqual(schema(false, null, { range: [0, undefined] }).create({ n: 0 }), { n: 0 });
	t.deepEqual(schema(false, null, { range: [-Infinity, 10] }).create({ n: 0 }), { n: 0 });
	t.deepEqual(schema(false, null, { range: [null, 10] }).create({ n: 0 }), { n: 0 });
	t.deepEqual(schema(false, null, { range: [undefined, 10] }).create({ n: 0 }), { n: 0 });
	throwsCode('outOfRange', () => { schema(false, null, { range: [0, 1] }).create({ n: -1 }); });
	throwsCode('outOfRange', () => { schema(false, null, { range: [0, 1] }).create({ n: 2 }); });
	throwsCode('outOfRange', () => { schema(false, null, { range: [0, 1] }).create({ n: 5 }); });
	t.throws(() => { schema(false, null, { range: [0.5, 1] }); });
	t.throws(() => { schema(false, null, { range: [0, 1.5] }); });

	// values

	t.deepEqual(schema(false, null, { values: [1, 3, 5] }).create({ n: 5 }), { n: 5 });
	throwsCode('badValue', () => { schema(false, null, { values: [0, 1] }).create({ n: 5 }); });
	throwsCode('badValue', () => { schema(false, null, { values: [0, 1] }).create({ n: -1 }); });
	t.throws(() => { schema(false, null, { values: 'str' }); });
	t.throws(() => { schema(false, null, { values: [] }); });
	t.throws(() => { schema(false, null, { values: [5.5] }); });
	t.throws(() => { schema(false, null, { values: [false, true] }); });
	t.throws(() => { schema(false, null, { values: [{}] }); });

	// type

	throwsCode('notInt', () => { schema(false).create({ n: 5.1 }); });
	throwsCode('notInt', () => { schema(false).create({ n: Infinity }); });
	throwsCode('notInt', () => { schema(false).create({ n: -Infinity }); });
	throwsCode('notInt', () => { schema(false).create({ n: 'str' }); });
	throwsCode('notInt', () => { schema(false).create({ n: true }); });
	throwsCode('notInt', () => { schema(false).create({ n: {} }); });
	throwsCode('notInt', () => { schema(false).create({ n: NaN }); });

	t.end();
});
