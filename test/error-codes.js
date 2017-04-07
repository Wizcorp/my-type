'use strict';

const test = require('tape');

test('Error codes', (t) => {
	const { int } = require('..');

	t.doesNotThrow(() => { int('error'); });
	t.doesNotThrow(() => { int(10000); });
	t.throws(() => { int(true); });
	t.throws(() => { int({}); });
	t.throws(() => { int([]); });

	t.end();
});
