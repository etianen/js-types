import BaseError from "@etianen/base-error";
import * as dict from "@etianen/dict";


// Utility types.

export type ObjectOf<T> = dict.Dict<T>;


// Errors.

export class ValueError<T> extends BaseError {

    constructor(message: string, public value: T) {
        super(message);
    }

    public toString(): string {
        return `${super.toString()} (received ${JSON.stringify(this.value)})`;
    }

}


// Runtime types.

export interface Type<T> {

    getName(): string;

    isTypeOf(value: Object): value is T;

}

function getTypeName(type: Type<Object>): string {
    return type.getName();
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


// Reference types.

class ReferenceOfType<T> implements Type<T> {

    constructor(private getType: () => Type<T>) {}

    public getName(): string {
        return this.getType().getName();
    }

    public isTypeOf(value: Object): value is T {
        return this.getType().isTypeOf(value);
    }

}

export function referenceOf<T>(getType: () => Type<T>): Type<T> {
    return new ReferenceOfType(getType);
}


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


// Union types.

class UnionOfType<A, B> implements Type<A & B> {

    constructor(private a: Type<A>, private b: Type<B>) {}

    public getName(): string {
        return `${this.a.getName()} & ${this.b.getName()}`;
    }

    public isTypeOf(value: Object): value is A & B {
        return (this.a.isTypeOf(value) && this.b.isTypeOf(value)) as boolean;
    }

}

export function unionOf<A, B>(a: Type<A>, b: Type<B>): Type<A & B> {
    return new UnionOfType(a, b);
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
    return value !== null && value !== undefined && Object.getPrototypeOf(value) === Object.prototype;
}

class ObjectOfType<T> implements Type<ObjectOf<T>> {

    constructor(private valueType: Type<T>) {}

    public getName(): string {
        return `Object<${this.valueType.getName()}>`;
    }

    public isTypeOf(value: Object): value is ObjectOf<T> {
        return isPlainObject(value) && dict.every(value, this.valueType.isTypeOf, this.valueType);
    }

}

export function objectOf<T>(valueType: Type<T>): Type<ObjectOf<T>> {
    return new ObjectOfType(valueType);
}


// Heterogenous arrays.

class TupleOfType implements Type<Array<Object>> {

    constructor(private types: Array<Type<Object>>) {}

    public getName(): string {
        return `[${this.types.map(getTypeName).join(", ")}]`;
    }

    public isTypeOf(value: Object): value is Array<Object> {
        return Array.isArray(value) && this.types.every((type: Type<Object>, index: number) => type.isTypeOf(value[index]));
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

function formatEntry(type: Type<Object>, key: string): string {
    return `${key}: ${type.getName()}`;
}

class ShapeOfType implements Type<ObjectOf<Object>> {

    constructor(private types: ObjectOf<Type<Object>>) {}

    public getName(): string {
        return `{${dict.map(this.types, formatEntry).join(", ")}}`;
    }

    public isTypeOf(value: Object): value is ObjectOf<Object> {
        return isPlainObject(value) && dict.every(this.types, (type: Type<Object>, key: string) => type.isTypeOf(value[key]));
    }

}

export function shapeOf(types: ObjectOf<Type<Object>>): Type<Object> {
    return new ShapeOfType(types);
}
