'use strict';

const test = require('tape');

test('Mixed', (t) => {
	const { object, mixed, string, int } = require('..');

	function schema(optional, types) {
		const n = mixed(types);

		if (optional) {
			n.optional();
		}

		return object({ n });
	}

	// optional

	t.deepEqual(schema(true).create({}), { n: undefined });
	t.throws(() => { schema(false).create({}); });

	// type

	t.doesNotThrow(() => { schema(false, [string(), int()]).create({ n: 1 }); });
	t.doesNotThrow(() => { schema(false, [string(), int()]).create({ n: 'str' }); });
	t.throws(() => { schema(false, [string(), int()]).create({ n: 1.5 }); });
	t.throws(() => { schema(false, [string(), int()]).create({ n: true }); });
	t.throws(() => { schema(false, [string(), int()]).create({ n: [] }); });
	t.throws(() => { schema(false, [string(), int()]).create({ n: {} }); });
	t.throws(() => { schema(false, [string(), 5]).create({ n: {} }); });

	// default subtypes

	t.deepEqual(schema(true, [string(), int().default(5)]).create({}), { n: 5 });
	t.deepEqual(schema(true, [string().default('foo'), int()]).create({}), { n: 'foo' });

	t.end();
});
