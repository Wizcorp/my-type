'use strict';

const serialize = {
	path: (entry) => {
		return entry.path.slice();
	},
	code: (entry) => {
		return entry.code;
	},
	message: (entry) => {
		return entry.message;
	},
	'failure condition': (entry) => {
		return entry.failureCondition;
	}
};

module.exports = function (entries, fields) {
	return entries.map((entry) => {
		const copy = {};
		for (const field of fields) {
			copy[field] = serialize[field](entry);
		}
		return copy;
	});
};
