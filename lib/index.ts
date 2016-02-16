// Utility types.

export type ObjectOf<T> = {[key: string]: T};


// Runtime types.

export abstract class Type<T> {

    public abstract getName(): string;

    public abstract isTypeOf(value: Object): value is T;

    public from(value: Object): T {
        if (this.isTypeOf(value)) {
            return value;
        }
        throw new TypeError(`Expected ${this.getName()}, received ${JSON.stringify(value)}`);
    }

}

abstract class NamedType<T> extends Type<T> {

    constructor(protected name: string) {
        super();
    }

    public getName(): string {
        return this.name;
    }

}


// Primitive types.

class PrimitiveType<T> extends NamedType<T> {

    public isTypeOf(value: Object): value is T {
        return typeof value === this.name;
    }

}

export const stringType: Type<string> = new PrimitiveType<string>("string");

export const numberType: Type<number> = new PrimitiveType<number>("number");

export const booleanType: Type<boolean> = new PrimitiveType<boolean>("boolean");


// Constant types.

class ConstantType<T> extends NamedType<T> {

    constructor(name: string, private constant: T) {
        super(name);
    }

    public isTypeOf(value: Object): value is T {
        return value === this.constant;
    }

}

export const nullType: Type<any> = new ConstantType<any>("null", null);

export const undefinedType: Type<any> = new ConstantType<any>("undefined", undefined);


// Intersection types.

class IntersectionOfType extends Type<any> {

    constructor(private types: Array<Type<Object>>) {
        super();
    }

    public getName(): string {
        return this.types.map((type: Type<Object>) => type.getName()).join(" | ");
    }

    public isTypeOf(value: Object): value is any {
        return this.types.some((type: Type<Object>) => type.isTypeOf(value));
    }

}

export function intersectionOf<A>(a: Type<A>): Type<A>;
export function intersectionOf<A, B>(a: Type<A>, b: Type<B>): Type<A | B>;
export function intersectionOf<A, B, C>(a: Type<A>, b: Type<B>, v: Type<C>): Type<A | B | C>;
export function intersectionOf<A, B, C, D>(a: Type<A>, b: Type<B>, c: Type<C>, d: Type<D>): Type<A | B | C | D>;
export function intersectionOf<A, B, C, D, E>(a: Type<A>, b: Type<B>, c: Type<C>, d: Type<D>, e: Type<E>): Type<A | B | C | D | E>;
export function intersectionOf(...types: Array<Type<Object>>): Type<any> {
    return new IntersectionOfType(types);
}

export function nullableOf<T>(type: Type<T>): Type<T> {
    return new IntersectionOfType([type, nullType]);
}

export function undefinedOf<T>(type: Type<T>): Type<T> {
    return new IntersectionOfType([type, undefinedType]);
}


// Homogenous arrays.

class ArrayOfType<T> extends Type<Array<T>> {

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
        return Array.isArray(value) && this.types.every((type: Type<Object>, index: number) => type.isTypeOf(value[index]));
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
