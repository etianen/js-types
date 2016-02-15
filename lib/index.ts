/**
 * A runtime type, allowing type detection and casting
 * of unknown types at runtime.
 */
export abstract class Type<T> {

    /**
     * Returns the human-readable name of this `Type`.
     *
     * ```
     * stringType.getName();  // => "string"
     * ```
     */
    public abstract getName(): string;

    /**
     * A type guard for this `Type`. If it passes, then
     * `value` is of this type.
     *
     * ```
     * if (stringType.isTypeOf(value)) {
     *     // Within this block, value is of type `string`.
     * }
     * ```
     */
    public abstract isTypeOf(value: Object): value is T;

    /**
     * Attempts to cast `value` to this `Type`.
     *
     * If `value` is `undefined`, and `defaultValue` is given,
     * `defaultValue` is returned.
     *
     * If `value` is not the correct type, a `TypeError` is raised.
     *
     * ```
     * try {
     *     const value: string = stringType.from(value, "defaultValue");
     * } catch (ex) {
     *     if (ex instanceof TypeError) {
     *         // Do with the TypeError.
     *     } else {
     *         // Handle unexpected errors.
     *     }
     * }
     * ```
     */
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

/**
 * A `Type` representing the primitive `string` type.
 *
 * ```
 * stringType.isTypeOf("foo");  // => true
 * ```
 */
export const stringType: Type<string> = new PrimitiveType<string>("string");

/**
 * A `Type` representing the primitive `number` type.
 *
 * ```
 * numberType.isTypeOf(1);  // => true
 * ```
 */
export const numberType: Type<number> = new PrimitiveType<number>("number");

/**
 * A `Type` representing the primitive `boolean` type.
 *
 * ```
 * booleanType.isTypeOf(true);  // => true
 * ```
 */
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

/**
 * Wraps another `Type` allowing it to accept `null` values
 * in addition to it's expected type.
 *
 * ```
 * nullableOf(stringType).isTypeOf(null);  // => true
 * nullableOf(stringType).isTypeOf("foo");  // => true
 * nullableOf(stringType).isTypeOf(undefined);  // => false
 * ```
 */
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

/**
 * Returns a `Type` representing an `Array` of `valueType`.
 *
 * ```
 * arrayOf(numberType).isTypeOf([5]);  // => true
 * ```
 */
export function arrayOf<T>(valueType: Type<T>): Type<Array<T>> {
    return new ArrayOf(valueType);
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

    constructor(private valueType: Type<T>) {
        super();
    }

    public getName(): string {
        return `Object<${this.valueType.getName()}>`;
    }

    public isTypeOf(value: Object): value is {[key: string]: T} {
        return isPlainObject(value) && every(value, (v: T) => {
            return this.valueType.isTypeOf(v);
        });
    }

}

/**
 * Returns a `Type` representing an `Object` where every
 * value is of `valueType`.
 *
 * ```
 * objectOf(numberType).isTypeOf({foo: 5});  // => true
 * ```
 */
export function objectOf<T>(valueType: Type<T>): Type<{[key: string]: T}> {
    return new ObjectOf(valueType);
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

/**
 * Returns a `Type` representing a heterogenous `Array` of `types`.
 *
 * ```
 * tupleOf([numberType, stringType]).isTypeOf([1, "foo"]);  // => true
 * ```
 */
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

/**
 * Returns a `Type` representing a heterogenous `Object` of `types`.
 *
 * ```
 * shapeOf({
 *     foo: numberType,
 *     bar: stringType,
 * }).isTypeOf({
 *     foo: 1,
 *     bar: "bar",
 * });  // => true
 * ```
 */
export function shapeOf(types: {[key: string]: Type<any>}): Type<{[key: string]: any}> {
    return new ShapeOf(types);
}
