'use strict';

const test = require('tape');

test('Objects', function (t) {
	const { object, int } = require('..');

	function schema(optional, defaultValue, props) {
		const o = object(props);

		if (optional) {
			o.optional();
		}

		if (defaultValue !== null && defaultValue !== undefined) {
			o.default(defaultValue);
		}

		return object({ o });
	}

	const props = { foo: int() };

	// optional

	t.deepEqual(schema(true, null, props).create({}), { o: undefined });
	t.throws(() => { schema(false, null, props).create({}); });

	// default

	t.deepEqual(schema(true, { foo: 3 }, props).create({}), { o: { foo: 3 } });
	t.deepEqual(schema(true, { foo: 3 }, props).create({ o: { foo: 5 } }), { o: { foo: 5 } });
	t.throws(() => { schema(true, 'str', props).create({}); });
	t.throws(() => { schema(true, { bar: 3 }, props).create({}); });

	// properties

	t.throws(() => { schema(true, null, { foo: 'no-type' }); });
	t.throws(() => { schema(true, null, props).create({ bar: 5 }); });
	t.throws(() => { schema(true, null, props).create(5); });
	t.throws(() => { schema(true, null, props).update(5, {}); });
	t.throws(() => { schema(true, null, props).update(5, 5); });
	t.deepEqual(schema(true, null, props).update({ o: { foo: 3 } }, { o: { foo: 5 } }), { o: { foo: 5 } });

	t.end();
});
