'use strict';

const test = require('tape');

test('Objects', (t) => {
	const { object, int, string, bool } = require('..');

	function schema(optional, props, dict, conditions = {}) {
		const o = object(props, 'notObject');

		if (optional) {
			o.optional();
		}

		if (dict) {
			o.dictionary(dict.prop, dict.value);
		}

		if (conditions.hasOwnProperty('min')) {
			o.min(conditions.min, 'tooShort');
		}

		if (conditions.hasOwnProperty('max')) {
			o.max(conditions.max, 'tooLong');
		}

		if (conditions.hasOwnProperty('length')) {
			o.length(conditions.length[0], conditions.length[1], 'badLength');
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
			t.fail(`Expected function to throw: ${fn}`);
		}
	}

	const props = { foo: int('notInt'), bar: int('notInt') };
	const propsWithDefault = { foo: int().default(3), bar: int().default(5) };
	const propsOptional = { foo: int().optional(), bar: int().optional() };

	// creation

	t.throws(() => { object(123); });
	t.throws(() => { object([]); });

	// optional

	t.deepEqual(schema(true, props).create({}), { o: undefined });
	t.throws(() => { schema(false, props).create({}); });

	// assert

	t.throws(() => { schema(false, props).assert({ o: {} }); });
	t.throws(() => { schema(false, props).assert({ o: [] }); });

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

	t.deepEqual(schema(false, propsOptional).update({ o: { foo: 1, bar: 2 } }, { o: { foo: undefined } }), { o: { foo: undefined, bar: 2 } });

	// dictionary properties

	const dictPropertyType = string().length(1, Infinity);
	const dictValueType = bool();
	const dict = { prop: dictPropertyType, value: dictValueType };

	t.deepEqual(schema(false, propsWithDefault, dict).create({}), { o: { foo: 3, bar: 5 } });
	t.deepEqual(schema(false, propsWithDefault, dict).create({ o: { a: true, b: false } }), { o: { foo: 3, bar: 5, a: true, b: false } });
	t.throws(() => { schema(true, propsWithDefault, dict).create({ o: { '': true } }); });
	t.throws(() => { schema(true, propsWithDefault, dict).create({ o: { a: 'str' } }); });
	t.throws(() => { schema(true, propsWithDefault, dict).create({ o: { a: 3 } }); });
	t.throws(() => { schema(true, propsWithDefault, dict).create({ o: { a: [] } }); });
	t.throws(() => { schema(true, propsWithDefault, dict).create({ o: { a: {} } }); });
	t.throws(() => { schema(true, propsWithDefault, { prop: 'foo', value: dictValueType }); });
	t.throws(() => { schema(true, propsWithDefault, { prop: dictPropertyType, value: 'foo' }); });

	// min

	t.throws(() => { schema(false, propsWithDefault, dict, { min: 0.5 }); });
	throwsCode('tooShort', () => { schema(false, propsWithDefault, dict, { min: 3 }).create({ o: {} }); });
	t.deepEqual(schema(false, propsWithDefault, dict, { min: 3 }).create({ o: { a: true } }), { o: { foo: 3, bar: 5, a: true } });

	// max

	t.throws(() => { schema(false, propsWithDefault, dict, { max: 0.5 }); });
	throwsCode('tooLong', () => { schema(false, propsWithDefault, dict, { max: 3 }).create({ o: { a: true, b: false } }); });
	t.deepEqual(schema(false, propsWithDefault, dict, { max: 3 }).create({ o: { a: true } }), { o: { foo: 3, bar: 5, a: true } });

	// length

	t.deepEqual(schema(false, propsWithDefault, dict, { length: [0, 10] }).create({ o: { foo: 3, bar: 5 } }), { o: { foo: 3, bar: 5 } });
	throwsCode('badLength', () => { schema(false, propsWithDefault, dict, { length: [0, 1] }).create({ o: {} }); });
	throwsCode('badLength', () => { schema(false, propsWithDefault, dict, { length: [3, 4] }).create({ o: {} }); });
	t.throws(() => { schema(false, propsWithDefault, dict, { length: [0.5, 1] }); });
	t.throws(() => { schema(false, propsWithDefault, dict, { length: [0, 1.5] }); });

	t.end();
});
