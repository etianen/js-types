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

    equals(a: T, b: T): boolean;

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
        return "…";
    }

    public isTypeOf(value: Object): value is T {
        return this.getType().isTypeOf(value);
    }

    public equals(a: T, b: T): boolean {
        return this.getType().equals(a, b);
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

    public equals(a: A | B, b: A | B): boolean {
        if (this.a.isTypeOf(a) && this.a.isTypeOf(b)) {
            return this.a.equals(a, b);
        } else if (this.b.isTypeOf(a) && this.b.isTypeOf(b)) {
            return this.b.equals(a, b);
        }
        return false;
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

    public equals(a: A & B, b: A & B): boolean {
        return this.a.equals(a, b) && this.b.equals(a, b);
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

    public equals(a: T, b: T): boolean {
        return (a === null && b === null) || this.type.equals(a, b);
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

    public equals(a: T, b: T): boolean {
        return (a === undefined && b === undefined) || this.type.equals(a, b);
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
    equals(a: Object, b: Object): boolean {
        return a === b;
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

    public equals(a: T, b: T): boolean {
        return a === b;
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

    public equals(a: Array<T>, b: Array<T>): boolean {
        return a.length === b.length && a.every((valueA: T, index: number) => this.valueType.equals(valueA, b[index]));
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

    public equals(a: ObjectOf<T>, b: ObjectOf<T>): boolean {
        return dict.count(a) === dict.count(b) && dict.every(a, (valueA: T, key: string) => this.valueType.equals(valueA, dict.get(b, key)));
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

    public equals(a: Array<Object>, b: Array<Object>): boolean {
        return this.types.every((type: Type<Object>, index: number) => type.equals(a[index], b[index]));
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
        return isPlainObject(value) && dict.every(this.types, (type: Type<Object>, key: string) => type.isTypeOf(dict.get(value, key)));
    }

    public equals(a: ObjectOf<Object>, b: ObjectOf<Object>): boolean {
        return dict.every(this.types, (type: Type<Object>, key: string) => type.equals(dict.get(a, key), dict.get(b, key)));
    }

}

export function shapeOf(types: ObjectOf<Type<Object>>): Type<Object> {
    return new ShapeOfType(types);
}
