'use strict';

function pad(str, len) {
	str = str || '';
	return `${str}${' '.repeat(len - str.length)}`;
}

function join(strings, lengths) {
	const out = [];

	for (let i = 0; i < strings.length; i += 1) {
		out[i] = pad(strings[i], lengths[i]);
	}

	return `| ${out.join(' | ')} |\n`;
}

const serialize = {
	default: (value) => {
		if (value === null || value === undefined) {
			return '';
		}

		return String(value);
	},
	path: (path) => {
		return path.join('.');
	}
};

module.exports = function (entries, fields, options) {
	const lengths = fields.map((field) => {
		return field.length;
	});

	for (const entry of entries) {
		for (let i = 0; i < fields.length; i += 1) {
			const field = fields[i];
			const toString = serialize[field] || serialize.default;

			lengths[i] = Math.max(lengths[i], toString(entry[field]).length);
		}
	}

	const totalLength = 4 + lengths.reduce((length, total) => {
		return total + length + 3;
	});

	let out = '';

	if (!options.skipHeader) {
		out += `+${'-'.repeat(totalLength - 2)}+\n`;
		out += join(fields, lengths);
	}

	out += `+${'-'.repeat(totalLength - 2)}+\n`;

	for (const entry of entries) {
		const row = [];

		for (let i = 0; i < fields.length; i += 1) {
			const toString = serialize[fields[i]] || serialize.default;

			row[i] = toString(entry[fields[i]]);
		}

		out += join(row, lengths);
	}

	out += `+${'-'.repeat(totalLength - 2)}+\n`;
	return out;
};
