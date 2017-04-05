'use strict';

const test = require('tape');

test('Objects', function (t) {
	const { object, int } = require('..');

	function schema(optional, props) {
		const o = object(props, 'notObject');

		if (optional) {
			o.optional();
		}

		return object({ o });
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

	const props = { foo: int('notInt'), bar: int('notInt') };
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
	throwsCode('notObject', () => { schema(true, props).create({ o: 5 }); });
	throwsCode('notInt', () => { schema(true, props).create({ o: { foo: 'str', bar: 'str' } }); });
	t.deepEqual(schema(false, props).update({ o: { foo: 3, bar: 5 } }, { o: { foo: 5, bar: 6 } }), { o: { foo: 5, bar: 6 } });
	t.deepEqual(schema(false, props).update({ o: { foo: 3, bar: 5 } }, { o: { foo: 5 } }), { o: { foo: 5, bar: 5 } });
	t.deepEqual(schema(false, propsWithDefault).create({}), { o: { foo: 3, bar: 5 } });
	t.deepEqual(schema(false, propsWithDefault).create({ o: { foo: 5, bar: 6 } }), { o: { foo: 5, bar: 6 } });
	t.deepEqual(schema(false, propsWithDefault).create({ o: { foo: 3 } }), { o: { foo: 3, bar: 5 } });

	// property deletion

	const propsOptional = { foo: int().optional(), bar: int().optional() };

	t.deepEqual(schema(false, propsOptional).update({ o: { foo: 1, bar: 2 } }, { o: { foo: undefined } }), { o: { foo: undefined, bar: 2 } });

	t.end();
});
