export type Dict<T> = {[key: string]: T};

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

    constructor(private valueType: Type<T>) {
        super();
    }

    public getName(): string {
        return `Array<${this.valueType.getName()}>`;
    }

    public isTypeOf(value: Object): value is Array<T> {
        return Array.isArray(value) && value.every((item: T) => this.valueType.isTypeOf(item));
    }

}

export function arrayOf<T>(valueType: Type<T>): Type<Array<T>> {
    return new ArrayOf(valueType);
}


// Homogonous objects.

function isPlainObject(value: Object): value is Dict<Object> {
    return value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype;
}

function has(value: Object, key: string): boolean {
    return Object.prototype.hasOwnProperty.call(value, key);
}

function every<T>(value: Dict<T>, callback: (value: T, key: string) => boolean): boolean {
    for (const key in value) {
        if (has(value, key)) {
            if (!callback(value[key], key)) {
                return false;
            }
        }
    }
    return true;
}

class ObjectOf<T> extends Type<Dict<T>> {

    constructor(private valueType: Type<T>) {
        super();
    }

    public getName(): string {
        return `Object<${this.valueType.getName()}>`;
    }

    public isTypeOf(value: Object): value is Dict<T> {
        return isPlainObject(value) && every(value, (v: T) => {
            return this.valueType.isTypeOf(v);
        });
    }

}

export function objectOf<T>(valueType: Type<T>): Type<Dict<T>> {
    return new ObjectOf(valueType);
}


// Heterogenous arrays.

class TupleOf extends Type<Array<Object>> {

    constructor(private types: Array<Type<Object>>) {
        super();
    }

    public getName(): string {
        return `[${this.types.map(type => type.getName()).join(", ")}]`;
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
export function tupleOf(types: Array<Type<Object>>): Type<Array<any>> {
    return new TupleOf(types);
}


// Heterogenous objects.

class ShapeOf extends Type<Dict<Object>> {

    constructor(private types: Dict<Type<Object>>) {
        super();
    }

    public getName(): string {
        return `{${Object.keys(this.types).map((key: string) => `${key}: ${this.types[key].getName()}`).join(", ")}}`;
    }

    public isTypeOf(value: Object): value is Dict<Object> {
        return isPlainObject(value) && every(this.types, (type: Type<Object>, key: string) => type.isTypeOf(value[key]));
    }

}

export function shapeOf(types: Dict<Type<Object>>): Type<Dict<any>> {
    return new ShapeOf(types);
}
