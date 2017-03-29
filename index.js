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
		this.assertDefaultValue();
		return this;
	}

	addTest(failure, message, userLabel) {
		this.tests.push(new Test(failure, message, userLabel));
		this.assertFn = undefined;
	}

	assertDefaultValue() {
		if (this.defaultValue !== undefined) {
			this.assert(this.defaultValue);
		}
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
		// TODO: test all values for type

		values = JSON.stringify(values);

		this.addTest(`!${values}.includes(value)`, `%name must be one of ${values}`, userLabel);
		this.assertDefaultValue();

		return this;
	}

	default(value) {
		if (value !== null && typeof value === 'object') {
			throw new MyTypeError('The default value is not a scalar type (found: %type)', value);
		}

		this.defaultValue = value;
		this.assertDefaultValue();

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

		this.assertDefaultValue();

		return this;
	}

	regexp(re, userLabel) {
		re = re.toString();
		this.addTest(`!${re}.test(value)`, `%name does not match regular expression: ${re}`, userLabel);

		this.assertDefaultValue();

		return this;
	}
}


class NumberType extends ScalarType {
	constructor() {
		super();
		this.addTest("typeof value !== 'number'", '%name is not a number (found: %type))');
	}

	range(min, max, userLabel) {
		if (typeof min === 'number' && min !== -Infinity) {
			this.addTest(`value < ${min}`, `%name must be >= ${min} (found: %value)`, userLabel);
		}

		if (typeof max === 'number' && max !== Infinity) {
			this.addTest(`value > ${max}`, `%name must be <= ${max} (found: %value)`, userLabel);
		}

		this.assertDefaultValue();

		return this;
	}
}


class IntType extends ScalarType {
	constructor() {
		super();
		this.addTest('!Number.isInteger(value)', '%name is not an integer (found: %type)');
	}

	range(min, max, userLabel) {
		if (typeof min === 'number' && min !== -Infinity) {
			this.addTest(`value < ${min}`, `%name must be >= ${min} (found: %value)`, userLabel);
		}

		if (typeof max === 'number' && max !== Infinity) {
			this.addTest(`value > ${max}`, `%name must be <= ${max} (found: %value)`, userLabel);
		}

		this.assertDefaultValue();

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
	constructor(types) {
		super();
		this.subTypes = types || [];

		for (const type of this.subTypes) {
			if (!(type instanceof Type)) {
				throw new MyTypeError(`Type is not a real type`, type);
			}
		}
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

		if (!(elementType instanceof Type)) {
			throw new MyTypeError(`Type for elements is not a real type`, elementType);
		}
	}

	default(value) {
		if (!Array.isArray(value)) {
			throw new MyTypeError('The default value is not an array (found: %type)', value);
		}

		this.defaultValue = deepCopy(value);
		this.assertDefaultValue();

		return this;
	}

	length(min, max, userLabel) {
		if (typeof min === 'number') {
			this.addTest(`value.length < ${min}`, `%name array length must be >= ${min} (found: %length)`, userLabel);
		}

		if (typeof max === 'number') {
			this.addTest(`value.length > ${max}`, `%name array length must be <= ${max} (found: %length)`, userLabel);
		}

		this.assertDefaultValue();

		return this;
	}

	assert(value) {
		super.assert(value);

		if (this.isOptional && (value === undefined || value === null)) {
			return;
		}

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

		for (const prop of this.propNames) {
			const type = propTypes[prop];

			if (!(type instanceof Type)) {
				throw new MyTypeError(`Type for property "${prop}" is not a real type`, type);
			}
		}

		this.createFn = undefined;
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

	_getDefaultObject() {
		if (this.isOptional) {
			return 'undefined';
		}

		const body = [];

		for (const prop of this.propNames) {
			const type = this.propTypes[prop];

			if (type instanceof ObjectType) {
				body.push(`  ${JSON.stringify(prop)}: ${type._getDefaultObject()}`);
			} else if (type.defaultValue === undefined) {
				body.push(`  ${JSON.stringify(prop)}: undefined`);
			} else {
				body.push(`  ${JSON.stringify(prop)}: ${JSON.stringify(type.defaultValue)}`);
			}
		}

		return `{\n${body.join(',\n  ')}\n}`;
	}

	create(data) {
		if (!this.createFn) {
			this.createFn = new Function(`return ${this._getDefaultObject()};`); // eslint-disable-line no-new-func
		}

		const obj = this.createFn();
		this.update(obj, data, true);
		return obj;
	}

	_assertUpdate(obj, data, testForMissingProperties) {
		if (typeof obj !== 'object') {
			throw new MyTypeError('The given object to update is not an object-type (found: %type)', obj);
		}

		if (typeof data !== 'object') {
			throw new TypeError('The given update-data is not an object-type (found: %type)', data);
		}

		const propNames = Object.keys(data);

		for (const prop of propNames) {
			const type = this.propTypes[prop];

			if (!type) {
				throw new MyTypeError(`Unknown property "${prop}"`, data[prop]);
			}

			try {
				if (type._assertUpdate) {
					type._assertUpdate(obj[prop], data[prop], testForMissingProperties);
				} else {
					type.assert(data[prop]);
				}
			} catch (error) {
				if (error.addParentProperty) {
					error.addParentProperty(prop);
				}
				throw error;
			}
		}

		if (testForMissingProperties) {
			for (const prop of this.propNames) {
				if (!data.hasOwnProperty(prop)) {
					// wasn't updated through the data object

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

	_applyUpdate(obj, data) {
		const propNames = Object.keys(data);

		for (const prop of propNames) {
			const type = this.propTypes[prop];

			if (type._applyUpdate) {
				type._applyUpdate(obj[prop], data[prop]);
			} else {
				obj[prop] = data[prop];
			}
		}
	}

	update(obj, data, testForMissingProperties) {
		if (data && obj) {
			this._assertUpdate(obj, data, testForMissingProperties || false);
			this._applyUpdate(obj, data);
		}

		return obj;
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

exports.mixed = function (types) {
	return new MixedType(types);
};

exports.object = function (propTypes) {
	return new ObjectType(propTypes);
};

exports.array = function (elementType) {
	return new ArrayType(elementType);
};
