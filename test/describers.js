'use strict';

const test = require('tape');

test('CSV describer', (t) => {
	const { object, array, number, int, string, describe } = require('..');

	const schema = object({
		foo: string().length(1, Infinity, 'outOfRange'),
		sub: object({
			bar: string().values(['foo', 'bar'], 'wrongEnumValue')
		})
	});

	let expected, actual;

	function joinRows(rows) {
		return `${rows.join('\n')}\n`;
	}


	// non-existing style

	t.throws(() => { describe(schema, 'foobar'); });

	// CSV: test all fields not throwing

	t.doesNotThrow(() => { describe(schema, 'csv'); });

	// CSV: test [path, code] output

	expected = joinRows([
		'"path","code"',
		'"",""',           // root not being optional
		'"",""',           // root not being an object
		'"foo",""',        // foo not being optional
		'"foo",""',        // foo not being a string
		'"foo","outOfRange"',
		'"sub",""',        // sub not being optional
		'"sub",""',        // sub not being an object
		'"sub.bar",""',    // bar not being optional
		'"sub.bar",""',    // bar not being a string
		'"sub.bar","wrongEnumValue"'
	]);

	actual = describe(schema, 'csv', ['path', 'code']);

	t.equal(actual, expected);

	// ASCII: test all fields not throwing

	t.doesNotThrow(() => { describe(schema, 'ascii'); });

	// ASCII: test [path, code] output

	expected = joinRows([
		'+--------------------------+',
		'| path    | code           |',
		'+--------------------------+',
		'|         |                |', // root not being optional
		'|         |                |', // root not being an object
		'| foo     |                |', // foo not being optional
		'| foo     |                |', // foo not being a string
		'| foo     | outOfRange     |',
		'| sub     |                |', // sub not being optional
		'| sub     |                |', // sub not being an object
		'| sub.bar |                |', // sub.bar not being optional
		'| sub.bar |                |', // sub.bar not being an object
		'| sub.bar | wrongEnumValue |',
		'+--------------------------+'
	]);

	actual = describe(schema, 'ascii', ['path', 'code']);

	t.equal(actual, expected);

	// JS: test all fields not throwing

	const actor = object({
		id: int().range(1, Infinity, 'invalidId'),
		name: string().length(3, Infinity, 'invalidNameLength'),
		birthday: string().regexp(/^[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}$/)
	});

	const movie = object({
		id: int().range(1, Infinity, 'invalidId'),
		name: string().length(3, 100, 'invalidNameLength'),
		year: int().range(1900, (new Date()).getFullYear(), 'invalidYear'),
		rating: number().optional().range(0, 1, 'invalidPercentage'),
		actors: array(actor)
	});

	t.doesNotThrow(() => { describe(movie, 'js'); });

	expected = [
		{ path: [], code: null },
		{ path: [], code: null },
		{ path: ['id'], code: null },
		{ path: ['id'], code: null },
		{ path: ['id'], code: 'invalidId' },
		{ path: ['name'], code: null },
		{ path: ['name'], code: null },
		{ path: ['name'], code: 'invalidNameLength' },
		{ path: ['name'], code: 'invalidNameLength' },
		{ path: ['year'], code: null },
		{ path: ['year'], code: null },
		{ path: ['year'], code: 'invalidYear' },
		{ path: ['year'], code: 'invalidYear' },
		{ path: ['rating'], code: null },
		{ path: ['rating'], code: null },
		{ path: ['rating'], code: 'invalidPercentage' },
		{ path: ['rating'], code: 'invalidPercentage' },
		{ path: ['actors'], code: null },
		{ path: ['actors'], code: null },
		{ path: ['actors[index]'], code: null },
		{ path: ['actors[index]'], code: null },
		{ path: ['actors[index]', 'id'], code: null },
		{ path: ['actors[index]', 'id'], code: null },
		{ path: ['actors[index]', 'id'], code: 'invalidId' },
		{ path: ['actors[index]', 'name'], code: null },
		{ path: ['actors[index]', 'name'], code: null },
		{ path: ['actors[index]', 'name'], code: 'invalidNameLength' },
		{ path: ['actors[index]', 'birthday'], code: null },
		{ path: ['actors[index]', 'birthday'], code: null },
		{ path: ['actors[index]', 'birthday'], code: null }
	];

	actual = describe(movie, 'js', ['path', 'code']);

	t.deepEqual(actual, expected);

	t.end();
});
