'use strict';

const deepCopy = require('deep-copy');

function getType(value) {
	if (value === null) {
		return 'null';
	}

	if (Array.isArray(value)) {
		return 'array';
	}

	return typeof value;
}


class MyTypeError extends TypeError {
	constructor(message, value) {
		super(message);

		this.name = 'MyTypeError';
		this.value = value;

		this._baseMessage = message;
		this._valueName = '';

		this.updateMessage();
	}

	addParentProperty(name) {
		if (typeof name === 'number') {
			// array index
			this._valueName = `[${name}]${this._valueName}`;
		} else {
			// object property name
			this._valueName = `.${name}${this._valueName}`;
		}

		this.updateMessage();
	}

	updateMessage() {
		this.message = this._baseMessage.
			replace('%type', getType(this.value)).
			replace('%name', this._valueName || 'Value').
			replace('%value', this.value).
			replace('%length', this.value && this.value.hasOwnProperty('length') ? this.value.length : 'undefined');
	}
}


class Test {
	constructor(failure, message, userLabel) {
		this.failure = failure;
		this.message = message;
		this.userLabel = userLabel;
	}

	toString() {
		let message = this.message;

		if (this.userLabel) {
			message = `${message} (${this.userLabel})`;
		}

		return `  if (${this.failure}) { throw new MyTypeError(${JSON.stringify(message)}, value); }`;
	}
}


class Type {
	constructor() {
		this.tests = [];
		this.assertFn = undefined;
		this.isOptional = false;
		this.defaultValue = undefined;
	}

	optional() {
		this.isOptional = true;
		this.assertFn = undefined;
		return this;
	}

	addTest(failure, message, userLabel) {
		this.tests.push(new Test(failure, message, userLabel));
		this.assertFn = undefined;
	}

	assert(value) {
		if (!this.assertFn) {
			const optionalTest = this.isOptional ?
				'  if (value === undefined || value === null) { return; }\n' :
				new Test('value === undefined || value === null', '%name is not optional');

			const tests = [optionalTest].concat(this.tests);

			this.assertFn = new Function('value', 'MyTypeError', tests.join('\n')); // eslint-disable-line no-new-func
		}

		this.assertFn(value, MyTypeError);
	}
}


class ScalarType extends Type {
	values(values, userLabel) {
		values = JSON.stringify(values);
		this.addTest(`!${values}.includes(value)`, `%name must be one of ${values}`, userLabel);
		return this;
	}

	default(value) {
		if (value !== null && typeof value === 'object') {
			throw new MyTypeError('The default value is not a scalar type (found: %type)', value);
		}

		this.defaultValue = value;
		return this;
	}
}


class StringType extends ScalarType {
	constructor() {
		super();
		this.addTest("typeof value !== 'string'", '%name is not a string (found: %type)');
	}

	length(min, max, userLabel) {
		if (typeof min === 'number') {
			this.addTest(`value.length < ${min}`, `%name string length must be >= ${min} (found: %length)`, userLabel);
		}

		if (typeof max === 'number') {
			this.addTest(`value.length > ${max}`, `%name string length must be <= ${max} (found: %length)`, userLabel);
		}

		return this;
	}

	regexp(re, userLabel) {
		re = re.toString();
		this.addTest(`!${re}.test(value)`, `%name does not match regular expression: ${re}`, userLabel);
		return this;
	}
}


class NumberType extends ScalarType {
	constructor() {
		super();
		this.addTest("typeof value !== 'number'", '%name is not a number (found: %type))');
	}

	range(min, max, userLabel) {
		if (typeof min === 'number') {
			this.addTest(`value < ${min}`, `%name must be >= ${min} (found: %value)`, userLabel);
		}

		if (typeof max === 'number') {
			this.addTest(`value > ${max}`, `%name must be <= ${max} (found: %value)`, userLabel);
		}

		return this;
	}
}


class IntType extends ScalarType {
	constructor() {
		super();
		this.addTest('!Number.isInteger(value)', '%name is not an integer (found: %type)');
	}

	range(min, max, userLabel) {
		if (typeof min === 'number') {
			this.addTest(`value < ${min}`, `%name must be >= ${min} (found: %value)`, userLabel);
		}

		if (typeof max === 'number') {
			this.addTest(`value > ${max}`, `%name must be <= ${max} (found: %value)`, userLabel);
		}

		return this;
	}
}


class BooleanType extends ScalarType {
	constructor() {
		super();
		this.addTest("typeof value !== 'boolean'", '%name is not a boolean (found: %type)');
	}
}


class AnyType extends Type {}


class MixedType extends Type {
	constructor() {
		super();
		this.subTypes = [];
	}

	types(types) {
		this.subTypes = types;
		return this;
	}

	assert(value) {
		super.assert(value);

		if (value !== undefined) {
			let lastError;

			for (const type of this.subTypes) {
				try {
					type.assert(value);
					return; // success!
				} catch (error) {
					lastError = error;
				}
			}

			if (lastError) {
				throw lastError;
			}
		}
	}
}


class ArrayType extends Type {
	constructor(elementType) {
		super();
		this.elementType = elementType;
		this.addTest('!Array.isArray(value)', '%name is not an array (found: %type)');
	}

	default(value) {
		if (!Array.isArray(value)) {
			throw new MyTypeError('The default value is not an array (found: %type)', value);
		}

		this.defaultValue = deepCopy(value);
		return this;
	}

	length(min, max, userLabel) {
		if (typeof min === 'number') {
			this.addTest(`value.length < ${min}`, `%name array length must be >= ${min} (found: %length)`, userLabel);
		}

		if (typeof max === 'number') {
			this.addTest(`value.length > ${max}`, `%name array length must be <= ${max} (found: %length)`, userLabel);
		}

		return this;
	}

	assert(value) {
		super.assert(value);

		for (let i = 0; i < value.length; i += 1) {
			try {
				this.elementType.assert(value[i]);
			} catch (error) {
				if (error.addParentProperty) {
					error.addParentProperty(i);
				}
				throw error;
			}
		}
	}
}


class ObjectType extends Type {
	constructor(propTypes) {
		super();
		this.addTest("value === null || typeof value !== 'object'", '%name is not an object (found: %type)');
		this.propTypes = propTypes;
		this.propNames = Object.keys(propTypes);

		this.createFn = undefined;
	}

	default(value) {
		if (!value || typeof value !== 'object') {
			throw new MyTypeError('The default value is not an object (found: %type)', value);
		}

		this.defaultValue = deepCopy(value);
		return this;
	}

	assert(value) {
		super.assert(value);

		if (this.isOptional && (value === undefined || value === null)) {
			return;
		}

		for (const prop of this.propNames) {
			try {
				this.propTypes[prop].assert(value[prop]);
			} catch (error) {
				if (error.addParentProperty) {
					error.addParentProperty(prop);
				}
				throw error;
			}
		}
	}

	create(data) {
		if (!this.createFn) {
			const body = [];

			for (const prop of this.propNames) {
				const value = this.propTypes[prop].defaultValue;

				if (value === undefined) {
					body.push(`  ${JSON.stringify(prop)}: undefined`);
				} else {
					body.push(`  ${JSON.stringify(prop)}: ${JSON.stringify(value)}`);
				}
			}

			this.createFn = new Function(`return {\n${body.join(',\n  ')}\n};`); // eslint-disable-line no-new-func
		}

		const obj = this.createFn();
		this.update(obj, data);
		return obj;
	}

	update(obj, data) {
		const unhandledProperties = {};
		for (const prop of this.propNames) {
			unhandledProperties[prop] = true;
		}

		if (data && obj) {
			if (typeof obj !== 'object') {
				throw new MyTypeError('The given object to update is not an object-type (found: %type)', obj);
			}

			if (typeof data !== 'object') {
				throw new TypeError('The given update-data is not an object-type (found: %type)', data);
			}

			const propNames = Object.keys(data);

			// first assert all properties are valid

			for (const prop of propNames) {
				const type = this.propTypes[prop];

				if (!type) {
					throw new MyTypeError(`Unknown property "${prop}"`, data[prop]);
				}

				if (!type.assert) {
					throw new MyTypeError(`Type for property "${prop}" has no assert() method`, data[prop]);
				}

				unhandledProperties[prop] = false;

				try {
					type.assert(data[prop]);
				} catch (error) {
					if (error.addParentProperty) {
						error.addParentProperty(prop);
					}
					throw error;
				}
			}

			// safely assign all properties

			for (const prop of propNames) {
				obj[prop] = data[prop];
			}
		}

		// check all properties that were not affected by the data-object

		for (const prop of this.propNames) {
			if (unhandledProperties[prop]) {
				const type = this.propTypes[prop];

				try {
					type.assert(obj[prop]);
				} catch (error) {
					if (error.addParentProperty) {
						error.addParentProperty(prop);
					}
					throw error;
				}
			}
		}
	}
}


exports.MyTypeError = MyTypeError;

exports.string = function () {
	return new StringType();
};

exports.number = function () {
	return new NumberType();
};

exports.int = function () {
	return new IntType();
};

exports.bool = function () {
	return new BooleanType();
};

exports.any = function () {
	return new AnyType();
};

exports.mixed = function () {
	return new MixedType();
};

exports.object = function (propTypes) {
	return new ObjectType(propTypes);
};

exports.array = function (elementType) {
	return new ArrayType(elementType);
};
