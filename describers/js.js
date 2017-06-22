'use strict';

const serialize = {
	default: (value) => {
		return value;
	},
	path: (path) => {
		return path.slice();
	}
};

module.exports = function (entries, fields) {
	return entries.map((entry) => {
		const copy = {};
		for (const field of fields) {
			const toString = serialize[field] || serialize.default;

			copy[field] = toString(entry[field]);
		}
		return copy;
	});
};
