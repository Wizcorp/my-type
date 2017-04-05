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
	constructor(message, value, code) {
		super(message);

		this.name = 'MyTypeError';
		this.value = value;
		this.code = code;

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
	constructor(failure, message, code) {
		if (code && typeof code !== 'number' && typeof code !== 'string') {
			throw new MyTypeError('The given error code must be a string or number (found: %type)', code);
		}

		this.failure = failure;
		this.message = JSON.stringify(message);
		this.code = code ? JSON.stringify(code) : 'undefined';
	}

	toString() {
		return `  if (${this.failure}) { throw new MyTypeError(${this.message}, value, ${this.code}); }`;
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

	addTest(failure, message, code) {
		this.tests.push(new Test(failure, message, code));
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
	values(values, code) {
		if (!Array.isArray(values)) {
			throw new MyTypeError('The given values are not in an array (found: %type)', values);
		}

		if (values.length === 0) {
			throw new MyTypeError('The given values are an empty array', values);
		}

		for (const value of values) {
			this.assert(value);
		}

		values = JSON.stringify(values);

		this.addTest(`!${values}.includes(value)`, `%name must be one of ${values}`, code);
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
	constructor(code) {
		super();
		this.addTest("typeof value !== 'string'", '%name is not a string (found: %type)', code);
	}

	length(min, max, code) {
		if (min !== null && min !== undefined) {
			if (!Number.isInteger(min)) {
				throw new MyTypeError('The min-length is not an integer (found: %type "%value")', min);
			}

			this.addTest(`value.length < ${min}`, `%name string length must be >= ${min} (found: %length)`, code);
		}

		if (max !== null && max !== undefined) {
			if (!Number.isInteger(max)) {
				throw new MyTypeError('The max-length is not an integer (found: %type "%value")', max);
			}

			this.addTest(`value.length > ${max}`, `%name string length must be <= ${max} (found: %length)`, code);
		}

		this.assertDefaultValue();

		return this;
	}

	regexp(re, code) {
		if (!(re instanceof RegExp)) {
			throw new MyTypeError('The value provided is not a regular expression (found: %type "%value")', re);
		}

		re = re.toString();
		this.addTest(`!${re}.test(value)`, `%name does not match regular expression: ${re}`, code);

		this.assertDefaultValue();

		return this;
	}
}


class NumberType extends ScalarType {
	constructor(code) {
		super();
		this.addTest("typeof value !== 'number'", '%name is not a number (found: %type))', code);
		this.addTest('value !== value', '%name is NaN', code);
	}

	range(min, max, code) {
		if (min !== null && min !== undefined && min !== -Infinity) {
			if (typeof min !== 'number' || min !== min) { // eslint-disable-line no-self-compare
				throw new MyTypeError('The min-value is not a number (found: %type "%value")', min);
			}

			this.addTest(`value < ${min}`, `%name must be >= ${min} (found: %value)`, code);
		}

		if (max !== null && max !== undefined && max !== Infinity) {
			if (typeof max !== 'number' || max !== max) { // eslint-disable-line no-self-compare
				throw new MyTypeError('The max-value is not a number (found: %type "%value")', max);
			}

			this.addTest(`value > ${max}`, `%name must be <= ${max} (found: %value)`, code);
		}

		this.assertDefaultValue();

		return this;
	}
}


class IntType extends ScalarType {
	constructor(code) {
		super();
		this.addTest('!Number.isInteger(value)', '%name is not an integer (found: %type)', code);
	}

	range(min, max, code) {
		if (min !== null && min !== undefined && min !== -Infinity) {
			if (!Number.isInteger(min)) {
				throw new MyTypeError('The min-value is not an integer (found: %type "%value")', min);
			}

			this.addTest(`value < ${min}`, `%name must be >= ${min} (found: %value)`, code);
		}

		if (max !== null && max !== undefined && max !== Infinity) {
			if (!Number.isInteger(max)) {
				throw new MyTypeError('The max-value is not an integer (found: %type "%value")', max);
			}

			this.addTest(`value > ${max}`, `%name must be <= ${max} (found: %value)`, code);
		}

		this.assertDefaultValue();

		return this;
	}
}


class BooleanType extends ScalarType {
	constructor(code) {
		super();
		this.addTest("typeof value !== 'boolean'", '%name is not a boolean (found: %type)', code);
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
	constructor(elementType, code) {
		super();
		this.elementType = elementType;
		this.addTest('!Array.isArray(value)', '%name is not an array (found: %type)', code);

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

	length(min, max, code) {
		if (typeof min === 'number') {
			this.addTest(`value.length < ${min}`, `%name array length must be >= ${min} (found: %length)`, code);
		}

		if (typeof max === 'number') {
			this.addTest(`value.length > ${max}`, `%name array length must be <= ${max} (found: %length)`, code);
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
	constructor(propTypes, code) {
		super();
		this.addTest("value === null || typeof value !== 'object'", '%name is not an object (found: %type)', code);
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

		const propNames = Object.keys(value);

		for (const prop of propNames) {
			const type = this.propTypes[prop];

			if (!type) {
				throw new MyTypeError(`Unknown property "${prop}"`, value[prop]);
			}

			try {
				type.assert(value[prop]);
			} catch (error) {
				if (error.addParentProperty) {
					error.addParentProperty(prop);
				}
				throw error;
			}
		}

		for (const prop of this.propNames) {
			if (!value.hasOwnProperty(prop)) {
				// wasn't updated through the data object

				const type = this.propTypes[prop];

				try {
					type.assert(value[prop]);
				} catch (error) {
					if (error.addParentProperty) {
						error.addParentProperty(prop);
					}
					throw error;
				}
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
		return this.update(obj, data);
	}

	update(obj, data) {
		if (!obj || typeof obj !== 'object') {
			// allow the not-an-object assertion failure to kick in
			this.assert(obj);
		}

		if (!data || typeof data !== 'object') {
			// allow the not-an-object assertion failure to kick in
			this.assert(data);
		}

		obj = this._merge(obj, data);
		this.assert(obj);
		return obj;
	}

	_merge(oldValue, newValue) {
		if (!newValue || typeof newValue !== 'object' || Array.isArray(newValue)) {
			return newValue;
		}

		if (!oldValue || typeof oldValue !== 'object') {
			return newValue;
		}

		// merge oldValue with newValue and return oldValue

		const propNames = Object.keys(newValue);
		for (const prop of propNames) {
			oldValue[prop] = this._merge(oldValue[prop], newValue[prop]);
		}

		return oldValue;
	}
}


exports.MyTypeError = MyTypeError;

exports.string = function (code) {
	return new StringType(code);
};

exports.number = function (code) {
	return new NumberType(code);
};

exports.int = function (code) {
	return new IntType(code);
};

exports.bool = function (code) {
	return new BooleanType(code);
};

exports.any = function () {
	return new AnyType();
};

exports.mixed = function (types) {
	return new MixedType(types);
};

exports.object = function (propTypes, code) {
	return new ObjectType(propTypes, code);
};

exports.array = function (elementType, code) {
	return new ArrayType(elementType, code);
};
