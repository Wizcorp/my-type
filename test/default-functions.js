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

	t.end();
});
