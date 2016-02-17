// Utility types.

export type ObjectOf<T> = {[key: string]: T};


// Errors.

interface ExtendedErrorConstructor extends ErrorConstructor {
    captureStackTrace: (ex: Error, constructor: Function) => void;
}

interface ExtendedError extends Error {
    stack: string;
}

export class ValueError<T> extends Error {

    public stack: string;

    constructor(public message: string, public value: T) {
        super();
        // Add the stack, if supported by the runtime.
        if ((Error as ExtendedErrorConstructor).captureStackTrace) {
            (Error as ExtendedErrorConstructor).captureStackTrace(this, this.constructor);
        } else {
            this.stack = ((new Error()) as ExtendedError).stack;
        }
    }

    public toString(): string {
        return `${this.message} (received ${JSON.stringify(this.value)})`;
    }

}


// Runtime types.

export interface Type<T> {

    getName(): string;

    isTypeOf(value: Object): value is T;

}

export function fromJS<T>(value: Object, type: Type<T>): T {
    if (type.isTypeOf(value)) {
        return value;
    }
    throw new ValueError(`Expected ${type.getName()}`, value);
}

export function fromJSON<T>(value: string, type: Type<T>): T {
    try {
        return fromJS(JSON.parse(value), type);
    } catch (ex) {
        if (ex instanceof SyntaxError) {
            throw new ValueError(`Invalid JSON`, value);
        }
        throw ex;
    }
};


// Intersection types.

class IntersectionOfType<A, B> implements Type<A | B> {

    constructor(private a: Type<A>, private b: Type<B>) {}

    public getName(): string {
        return `${this.a.getName()} | ${this.b.getName()}`;
    }

    public isTypeOf(value: Object): value is A | B {
        return this.a.isTypeOf(value) || this.b.isTypeOf(value);
    }

}

export function intersectionOf<A, B>(a: Type<A>, b: Type<B>): Type<A | B> {
    return new IntersectionOfType(a, b);
}


// Null types.

class NullableOfType<T> implements Type<T> {

    constructor(private type: Type<T>) {}

    public getName(): string {
        return this.type.getName();
    }

    public isTypeOf(value: Object): value is T {
        return value === null || this.type.isTypeOf(value);
    }

}

export function nullableOf<T>(type: Type<T>): Type<T> {
    return new NullableOfType(type);
}


// Undefined types.

class OptionalOfType<T> implements Type<T> {

    constructor(private type: Type<T>) {}

    public getName(): string {
        return `${this.type.getName()}?`;
    }

    public isTypeOf(value: Object): value is T {
        return value === undefined || this.type.isTypeOf(value);
    }

}

export function optionalOf<T>(type: Type<T>): Type<T> {
    return new OptionalOfType(type);
}


// Strict any type.

export const anyType: Type<Object> = {
    getName(): string {
        return "any";
    },
    isTypeOf(value: Object): value is Object {
        return value !== null && value !== undefined;
    },
};


// Primitive types.

class PrimitiveType<T> implements Type<T> {

    constructor(private name: string) {}

    public getName(): string {
        return this.name;
    }

    public isTypeOf(value: Object): value is T {
        return typeof value === this.name;
    }

}

export const stringType: Type<string> = new PrimitiveType<string>("string");

export const numberType: Type<number> = new PrimitiveType<number>("number");

export const booleanType: Type<boolean> = new PrimitiveType<boolean>("boolean");


// Homogenous arrays.

class ArrayOfType<T> implements Type<Array<T>> {

    constructor(private valueType: Type<T>) {}

    public getName(): string {
        return `Array<${this.valueType.getName()}>`;
    }

    public isTypeOf(value: Object): value is Array<T> {
        return Array.isArray(value) && value.every(this.valueType.isTypeOf, this.valueType);
    }

}

export function arrayOf<T>(valueType: Type<T>): Type<Array<T>> {
    return new ArrayOfType(valueType);
}


// Homogonous objects.

function isPlainObject(value: Object): value is ObjectOf<Object> {
    return value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype;
}

class ObjectOfType<T> implements Type<ObjectOf<T>> {

    constructor(private valueType: Type<T>) {}

    public getName(): string {
        return `Object<${this.valueType.getName()}>`;
    }

    public isTypeOf(value: Object): value is ObjectOf<T> {
        if (isPlainObject(value)) {
            for (const key in value) {
                if (Object.prototype.hasOwnProperty.call(value, key)) {
                    if (!this.valueType.isTypeOf(value[key])) {
                        return false;
                    }
                }
            }
            return true;
        }
        return false;
    }

}

export function objectOf<T>(valueType: Type<T>): Type<ObjectOf<T>> {
    return new ObjectOfType(valueType);
}


// Heterogenous arrays.

class TupleOfType implements Type<Array<Object>> {

    constructor(private types: Array<Type<Object>>) {}

    public getName(): string {
        return `[${this.types.map(type => type.getName()).join(", ")}]`;
    }

    public isTypeOf(value: Object): value is Array<Object> {
        if (Array.isArray(value)) {
            for (let i = 0, l = this.types.length; i < l; i++) {
                if (!this.types[i].isTypeOf(value[i])) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }

}

export function tupleOf<A>(types: [Type<A>]): Type<[A]>;
export function tupleOf<A, B>(types: [Type<A>, Type<B>]): Type<[A, B]>;
export function tupleOf<A, B, C>(types: [Type<A>, Type<B>, Type<C>]): Type<[A, B, C]>;
export function tupleOf<A, B, C, D>(types: [Type<A>, Type<B>, Type<C>, Type<D>]): Type<[A, B, C, D]>;
export function tupleOf<A, B, C, D, E>(types: [Type<A>, Type<B>, Type<C>, Type<D>, Type<E>]): Type<[A, B, C, D, E]>;
export function tupleOf(types: Array<Type<Object>>): Type<Array<Object>> {
    return new TupleOfType(types);
}


// Heterogenous objects.

class ShapeOfType implements Type<ObjectOf<Object>> {

    constructor(private types: ObjectOf<Type<Object>>) {}

    public getName(): string {
        return `{${Object.keys(this.types).map((key: string) => `${key}: ${this.types[key].getName()}`).join(", ")}}`;
    }

    public isTypeOf(value: Object): value is ObjectOf<Object> {
        if (isPlainObject(value)) {
            for (const key in this.types) {
                if (Object.prototype.hasOwnProperty.call(this.types, key)) {
                    if (!this.types[key].isTypeOf(value[key])) {
                        return false;
                    }
                }
            }
            return true;
        }
        return false;
    }

}

export function shapeOf(types: ObjectOf<Type<Object>>): Type<Object> {
    return new ShapeOfType(types);
}
