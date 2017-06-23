'use strict';

function escape(str) {
	return `"${str.replace(/"/g, '\\"')}"`;
}

function join(cells, delimiter) {
	return `${cells.join(delimiter)}\n`;
}

const serialize = {
	default: (value) => {
		if (value === null || value === undefined) {
			return '""';
		}

		return escape(String(value));
	},
	path: (path) => {
		return escape(path.join('.'));
	}
};

module.exports = function (entries, fields, options) {
	const delimiter = typeof options.delimiter === 'string' ? options.delimiter : ',';

	let out = '';

	if (!options.skipHeader) {
		out += join(fields.map(escape), delimiter);
	}

	for (const entry of entries) {
		out += join(fields.map((field) => {
			const toString = serialize[field] || serialize.default;

			return toString(entry[field]);
		}), delimiter);
	}

	return out;
};
