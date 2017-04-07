'use strict';

function escape(str) {
	return `"${str.replace(/"/g, '\\"')}"`;
}

function join(cells) {
	return `${cells.join(',')}\n`;
}

const serialize = {
	path: (entry) => {
		return escape(entry.path.join('.'));
	},
	code: (entry) => {
		return escape(entry.code || '');
	},
	message: (entry) => {
		return escape(entry.message || '');
	},
	'failure condition': (entry) => {
		return escape(entry.failureCondition || '');
	}
};

module.exports = function (entries, fields) {
	let out = join(fields.map(escape));

	for (const entry of entries) {
		out += join(fields.map((field) => {
			return serialize[field](entry);
		}));
	}

	return out;
};
