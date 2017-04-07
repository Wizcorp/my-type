'use strict';

const test = require('tape');

test('Any', (t) => {
	const { object, any } = require('..');

	function schema(optional) {
		const n = any();

		if (optional) {
			n.optional();
		}

		return object({ n });
	}

	// optional

	t.deepEqual(schema(true).create({}), { n: undefined });
	t.throws(() => { schema(false).create({}); });

	// type

	t.doesNotThrow(() => { schema(false).create({ n: 1 }); });
	t.doesNotThrow(() => { schema(false).create({ n: 1.5 }); });
	t.doesNotThrow(() => { schema(false).create({ n: true }); });
	t.doesNotThrow(() => { schema(false).create({ n: false }); });
	t.doesNotThrow(() => { schema(false).create({ n: 'str' }); });
	t.doesNotThrow(() => { schema(false).create({ n: ['str'] }); });
	t.doesNotThrow(() => { schema(false).create({ n: [] }); });
	t.doesNotThrow(() => { schema(false).create({ n: {} }); });
	t.doesNotThrow(() => { schema(false).create({ n: { foo: 'bar' } }); });

	t.end();
});
