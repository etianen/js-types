export abstract class Type<T> {

    public abstract getName(): string;

    public abstract isTypeOf(value: Object): value is T;

    public from(value: Object, defaultValue?: T): T {
        if (value === undefined && defaultValue !== undefined) {
            return defaultValue;
        }
        if (this.isTypeOf(value)) {
            return value;
        }
        throw new TypeError(`Expected ${this.getName()}, received ${value}`);
    }

}


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


// Nullable types.

class NullableOf<T> extends Type<T> {

    constructor(private type: Type<T>) {
        super();
    }

    public getName(): string {
        return `${this.type.getName()}?`;
    }

    public isTypeOf(value: Object): value is T {
        return value === null || this.type.isTypeOf(value);
    }

}

export function nullableOf<T>(type: Type<T>): Type<T> {
    return new NullableOf(type);
}


// Homogenous arrays.

class ArrayOf<T> extends Type<Array<T>> {

    constructor(private type: Type<T>) {
        super();
    }

    public getName(): string {
        return `Array<${this.type.getName()}>`;
    }

    public isTypeOf(value: Object): value is Array<T> {
        return Array.isArray(value) && value.every((item: T) => this.type.isTypeOf(item));
    }

}

export function arrayOf<T>(type: Type<T>): Type<Array<T>> {
    return new ArrayOf(type);
}


// Homogonous objects.

function isPlainObject(value: Object): value is {[key: string]: any} {
    return value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype;
}

function has(value: Object, key: string): boolean {
    return Object.prototype.hasOwnProperty.call(value, key);
}

function every<T>(value: {[key: string]: T}, callback: (value: T, key: string) => boolean): boolean {
    for (const key in value) {
        if (has(value, key)) {
            if (!callback(value[key], key)) {
                return false;
            }
        }
    }
    return true;
}

class ObjectOf<T> extends Type<{[key: string]: T}> {

    constructor(private type: Type<T>) {
        super();
    }

    public getName(): string {
        return `Object<${this.type.getName()}>`;
    }

    public isTypeOf(value: Object): value is {[key: string]: T} {
        return isPlainObject(value) && every(value, (v: T) => {
            return this.type.isTypeOf(v);
        });
    }

}

export function objectOf<T>(type: Type<T>): Type<{[key: string]: T}> {
    return new ObjectOf(type);
}


// Heterogenous arrays.

class TupleOf extends Type<Array<any>> {

    constructor(private types: Array<Type<any>>) {
        super();
    }

    public getName(): string {
        return `[${this.types.map(type => type.getName()).join(", ")}]`;
    }

    public isTypeOf(value: Object): value is Array<any> {
        return Array.isArray(value) && this.types.every((type: Type<any>, index: number) => type.isTypeOf(value[index]));
    }

}

export function tupleOf<A>(types: [Type<A>]): Type<[A]>;
export function tupleOf<A, B>(types: [Type<A>, Type<B>]): Type<[A, B]>;
export function tupleOf<A, B, C>(types: [Type<A>, Type<B>, Type<C>]): Type<[A, B, C]>;
export function tupleOf<A, B, C, D>(types: [Type<A>, Type<B>, Type<C>, Type<D>]): Type<[A, B, C, D]>;
export function tupleOf<A, B, C, D, E>(types: [Type<A>, Type<B>, Type<C>, Type<D>, Type<E>]): Type<[A, B, C, D, E]>;
export function tupleOf(types: Array<Type<any>>): Type<Array<any>> {
    return new TupleOf(types);
}


// Heterogenous objects.

class ShapeOf extends Type<{[key: string]: any}> {

    constructor(private types: {[key: string]: Type<any>}) {
        super();
    }

    public getName(): string {
        return `{${Object.keys(this.types).map((key: string) => `${key}: ${this.types[key].getName()}`).join(", ")}}`;
    }

    public isTypeOf(value: Object): value is Array<any> {
        return isPlainObject(value) && every(this.types, (type: Type<any>, key: string) => type.isTypeOf(value[key]));
    }

}

export function shapeOf(types: {[key: string]: Type<any>}): Type<{[key: string]: any}> {
    return new ShapeOf(types);
}
