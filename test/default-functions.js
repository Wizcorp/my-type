'use strict';

const test = require('tape');

test('Integers', (t) => {
	const { object, int } = require('..');

	function schema(optional, defaultValue) {
		const n = int('notInt');

		if (defaultValue !== null && defaultValue !== undefined) {
			n.default(defaultValue);
		}

		return object({ n });
	}

	// default functions

	const date = Date.now();

	t.deepEqual(schema(true, () => { return date; }).create({}), { n: date });

	// default functions that support closures

	let i = 0;

	function fn() {
		i += 1;
		return i;
	}

	t.deepEqual(schema(true, fn).create({}), { n: 1 });
	t.deepEqual(schema(true, fn).create({}), { n: 2 });
	t.deepEqual(schema(true, fn).create({}), { n: 3 });

	const s = schema(true, fn);
	t.deepEqual(s.create({}), { n: 4 });
	t.deepEqual(s.create({}), { n: 5 });
	t.deepEqual(s.create({}), { n: 6 });

	// bad types

	function badFn() {
		// not an integer
		return 'foo';
	}

	t.throws(() => { schema(true, badFn).create({}); });

	t.end();
});
