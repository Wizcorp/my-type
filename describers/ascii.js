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
	path: (entry) => {
		return entry.path.join('.');
	},
	code: (entry) => {
		return entry.code || '';
	},
	message: (entry) => {
		return entry.message || '';
	},
	'failure condition': (entry) => {
		return entry.failureCondition || '';
	}
};

module.exports = function (entries, fields) {
	const lengths = fields.map((field) => {
		return field.length;
	});

	for (const entry of entries) {
		for (let i = 0; i < fields.length; i += 1) {
			lengths[i] = Math.max(lengths[i], serialize[fields[i]](entry).length);
		}
	}

	const totalLength = 4 + lengths.reduce((length, total) => {
		return total + length + 3;
	});

	let out = '';

	out += `+${'-'.repeat(totalLength - 2)}+\n`;
	out += join(fields, lengths);
	out += `+${'-'.repeat(totalLength - 2)}+\n`;

	for (const entry of entries) {
		const row = [];

		for (let i = 0; i < fields.length; i += 1) {
			row[i] = serialize[fields[i]](entry);
		}

		out += join(row, lengths);
	}

	out += `+${'-'.repeat(totalLength - 2)}+\n`;
	return out;
};
