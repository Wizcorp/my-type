'use strict';

const test = require('tape');

test('Objects', function (t) {
	const { object, int } = require('..');

	function schema(optional, props) {
		const o = object(props);

		if (optional) {
			o.optional();
		}

		return object({ o });
	}

	const props = { foo: int(), bar: int() };
	const propsWithDefault = { foo: int().default(3), bar: int().default(5) };

	// optional

	t.deepEqual(schema(true, props).create({}), { o: undefined });
	t.throws(() => { schema(false, props).create({}); });

	// properties

	t.throws(() => { schema(true, { foo: 'no-type' }); });
	t.throws(() => { schema(true, props).create({ abc: 5 }); });
	t.throws(() => { schema(true, props).create(5); });
	t.throws(() => { schema(true, props).update(5, {}); });
	t.throws(() => { schema(true, props).update(5, 5); });
	t.deepEqual(schema(false, props).update({ o: { foo: 3, bar: 5 } }, { o: { foo: 5, bar: 6 } }), { o: { foo: 5, bar: 6 } });
	t.deepEqual(schema(false, props).update({ o: { foo: 3, bar: 5 } }, { o: { foo: 5 } }), { o: { foo: 5, bar: 5 } });
	t.deepEqual(schema(false, propsWithDefault).create({}), { o: { foo: 3, bar: 5 } });
	t.deepEqual(schema(false, propsWithDefault).create({ o: { foo: 5, bar: 6 } }), { o: { foo: 5, bar: 6 } });
	t.deepEqual(schema(false, propsWithDefault).create({ o: { foo: 3 } }), { o: { foo: 3, bar: 5 } });

	t.end();
});
