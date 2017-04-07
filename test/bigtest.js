'use strict';

const test = require('tape');
const uuid = require('uuid/v4');

test('Create and update a big object', (t) => {
	const { object, array, string, number, int, bool, mixed } = require('..');

	const userIdType = string().regexp(/^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$/, 'UUID');

	const schema = object({
		id: userIdType,
		name: string().length(3, 50),
		age: int().range(18, 150).optional(),
		sex: string().values(['M', 'F']),
		isBanned: bool().default(false),
		score: number().default(0).range(0, 100),
		foobar: mixed([number(), string()]),
		lastSeenUsers: array(userIdType).length(0, 5),
		pets: object({
			cat: string().optional(),
			dog: string().optional()
		})
	});

	const id = uuid();
	const ids = [uuid(), uuid(), uuid()];

	const expectedBob1 = {
		id,
		name: 'Bob',
		age: undefined,
		sex: 'M',
		isBanned: false,
		score: 0,
		foobar: 3,
		lastSeenUsers: [],
		pets: {
			cat: undefined,
			dog: undefined
		}
	};

	const expectedBob2 = {
		id,
		name: 'Bob2',
		age: 20,
		sex: 'M',
		isBanned: false,
		score: 0,
		foobar: 3,
		lastSeenUsers: ids.slice(),
		pets: {
			cat: 'Flip',
			dog: undefined
		}
	};

	const bob = schema.create({
		id,
		name: 'Bob',
		sex: 'M',
		foobar: 3,
		lastSeenUsers: []
	});

	t.deepEqual(bob, expectedBob1);

	schema.update(bob, {
		name: 'Bob2',
		age: 20,
		lastSeenUsers: ids.slice(),
		pets: {
			cat: 'Flip'
		}
	});

	t.deepEqual(bob, expectedBob2);

	// remove properties to look like original Bob again

	schema.update(bob, {
		name: 'Bob',
		age: undefined,
		lastSeenUsers: [],
		pets: {
			cat: undefined,
			dog: undefined
		}
	});

	t.deepEqual(bob, expectedBob1);

	t.end();
});
