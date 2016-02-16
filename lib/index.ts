// Utility types.

export type ObjectOf<T> = {[key: string]: T};


// Errors.

export class ValueError<T> extends Error {

    public stack: string;

    constructor(public message: string, public value: T) {
        super();
        // Add the stack, if supported by the runtime.
        if ((Error as any).captureStackTrace) {
            (Error as any).captureStackTrace(this, this.constructor);
        } else {
            this.stack = (new (Error as any)()).stack;
        }
    }

    public toString(): string {
        return `${this.message} (received ${JSON.stringify(this.value)})`;
    }

}


// Runtime types.

export abstract class Type<T> {

    public abstract getName(): string;

    public abstract isTypeOf(value: Object): value is T;

    public from(value: Object): T {
        if (this.isTypeOf(value)) {
            return value;
        }
        throw new ValueError(`Expected ${this.getName()}`, value);
    }

    public fromJSON(value: string): T {
        try {
            return this.from(JSON.parse(value));
        } catch (ex) {
            if (ex instanceof SyntaxError) {
                throw new ValueError(`Invalid JSON`, value);
            }
            throw ex;
        }
    }

    public or<U>(type: Type<U>): Type<T | U> {
        return new IntersectionOfType(this, type);
    }

    public orNull(): Type<T> {
        return new OrNullType(this);
    }

    public orUndefined(): Type<T> {
        return new OrUndefinedType(this);
    }

}

class IntersectionOfType<A, B> extends Type<A | B> {

    constructor(private a: Type<A>, private b: Type<B>) {
        super();
    }

    public getName(): string {
        return `${this.a.getName()} | ${this.b.getName()}`;
    }

    public isTypeOf(value: Object): value is A | B {
        return this.a.isTypeOf(value) || this.b.isTypeOf(value);
    }

}

class OrNullType<T> extends Type<T> {

    constructor(private type: Type<T>) {
        super();
    }

    public getName(): string {
        return this.type.getName();
    }

    public isTypeOf(value: Object): value is T {
        return value === null || this.type.isTypeOf(value);
    }

}

class OrUndefinedType<T> extends Type<T> {

    constructor(private type: Type<T>) {
        super();
    }

    public getName(): string {
        return `${this.type.getName()}?`;
    }

    public isTypeOf(value: Object): value is T {
        return value === undefined || this.type.isTypeOf(value);
    }

}


// Strict any type.

class AnyType extends Type<Object> {

    public getName(): string {
        return "any";
    }

    public isTypeOf(value: Object): value is Object {
        return value !== null && value !== undefined;
    }

}

export const anyType: Type<Object> = new AnyType();


// Primitive types.

class PrimitiveType<T> extends Type<T> {

    constructor(private name: string) {
        super();
    }

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

class ArrayOfType<T> extends Type<Array<T>> {

    constructor(private valueType: Type<T>) {
        super();
    }

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

class ObjectOfType<T> extends Type<ObjectOf<T>> {

    constructor(private valueType: Type<T>) {
        super();
    }

    public getName(): string {
        return `ObjectOf<${this.valueType.getName()}>`;
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

class TupleOfType extends Type<Array<Object>> {

    constructor(private types: Array<Type<Object>>) {
        super();
    }

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
export function tupleOf(types: Array<Type<Object>>): Type<Array<any>> {
    return new TupleOfType(types);
}


// Heterogenous objects.

class ShapeOfType extends Type<ObjectOf<Object>> {

    constructor(private types: ObjectOf<Type<Object>>) {
        super();
    }

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

export function shapeOf(types: ObjectOf<Type<Object>>): Type<any> {
    return new ShapeOfType(types);
}
