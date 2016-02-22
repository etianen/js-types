# @etianen/types

Runtime type checking of untrusted data.


## Installing

``` bash
npm install '@etianen/types'
```

**TypeScript:** To take advantage of typings, be sure to set `moduleResolution` to `"node"` in your `tsconfig.json`.


## Overview

When receiving JSON data from an untrusted source, it's tempting to just assume the data is of the expected type and shape. This can lead to confusing errors appearing deep in your code.

@etianen/types provides a mechanism to check that untrusted data is the correct shape, or throw a useful debugging error.

``` ts
import {numberType, arrayOf, ValueError, fromJSON} from "@etianen/types";

const numberArrayType = arrayOf(numberType);
numberArrayType.isTypeOf([1]);  // => true
numberArrayType.isTypeOf(["foo"]);  // => false
numberArrayType.isTypeOf(true);  // => false

try {
    const trustedValue = fromJSON(untrustedString);
} catch (ex) {
    if (ex instanceof ValueError) {
        console.log(ex.toString());
    }
}
```


## API

### fromJS()

Casts `value` to `Type`, or throws a `ValueError`.

``` ts
fromJS<T>(value: Object, type: Type<T>): T;
```


### fromJSON()

Parses `value` as JSON and casts to `Type`, or throws a `ValueError`.

``` ts
fromJSON<T>(value: string, type: Type<T>): T;
```


### Type

A description of a runtime type.

#### Type.isTypeOf()

Checks that `value` is of this `Type`.

``` ts
Type.isTypeOf<T>(value: Object): value is T;
```


#### Type.getName()

Returns the descriptive name of `Type`.

``` ts
Type.getName(): string;
```


### ValueError

Error thrown when a value is of the incorrect type.


#### ValueError.message

A description of the problem.

``` ts
ValueError.message: string;
```


#### ValueError.stack

A stack trace to the source of the problem.

``` ts
ValueError.message: string;
```


#### ValueError.value

The value that caused the error.

``` ts
ValueError<T>.value: T;
```


#### ValueError.toString

A description of the problem, including the value that caused the error.

``` ts
ValueError.toString(): string;
```


## Built-in types

The library of built-in types is designed to be as strict as possible, avoiding
unexpected behavior deep within your code. This means:

* A `Type` does not accept `null` unless explicitly allowed via `nullableOf()`.
* A `Type` does not accept `undefined` unless explicitly allowed via `optionalOf()`.


### stringType

A `Type` representing `string`.

```ts
const stringType: Type<string>;
```


### numberType

A `Type` representing `number`.

```ts
const numberType: Type<number>;
```


### booleanType

A `Type` representing `boolean`.

```ts
const booleanType: Type<boolean>;
```


### anyType

A `Type` representing any value that is not `null` or `undefined`.

``` ts
const anyType: Type<Object>;
```

**Typescript note:** The `Object` type is used in place of `any` to avoid "poisoning" the rest of your codebase with cascading `any`. Use explicit type casts to convert `Object` to known types elsewhere in your codebase, or use `intersectionOf()` if multiple types are allowed.


### `nullableOf()`

A `Type` modifier representing a value that may be `null`.

``` ts
nullableOf<T>(value: Object): Type<T>;
```


### `optionalOf()`

A `Type` modifier representing a value that may be `undefined`.

``` ts
optionalOf<T>(value: Object): Type<T>;
```


### `intersectionOf()`

A `Type` modifier representing a value that must be either of two `Type`s.

``` ts
intersectionOf<A, B>(typeA: Type<A>, typeB: Type<B>): Type<A | B>;
```


### `unionOf()`

A `Type` modifier representing a value must be both of two `Type`s.

``` ts
unionOf<A, B>(typeA: Type<A>, typeB: Type<B>): Type<A & B>;
```


### `arrayOf()`

A container `Type` representing a homogenous array of another `Type`.

``` ts
arrayOf<T>(valueType: Type<T>): Type<Array<T>>;
```


### `objectOf()`

A container `Type` representing a homogenous object of another `Type`.

``` ts
objectOf<T>(valueType: Type<T>): ObjectOf<T>;
```


### `tupleOf()`

A container `Type` representing a heterogenous array of other `Type`s.

``` ts
tupleOf<A>(types: Array<Type<A>>): Type<[A]>;
tupleOf<A, B>(types: Array<Type<A>, Type<B>>): Type<[A, B]>;
tupleOf<A, B, C>(types: Array<Type<A>, Type<B>, Type<C>>): Type<[A, B, C]>;
tupleOf<A, B, C, C>(types: Array<Type<A>, Type<B>, Type<C>, Type<D>>): Type<[A, B, C, D]>;
tupleOf<A, B, C, C, D>(types: Array<Type<A>, Type<B>, Type<C>, Type<D>, Type<E>>): Type<[A, B, C, D, E]>;
tupleOf(types: Array<Type<Object>>): Type<Array<Object>>
```

**Typescript note:** For tuples of more than 5 items, an explicit type cast will be required.

``` ts
// No explicit type cast required.
const smallTupleType: Type<[string, string]> = tupleOf([stringType, stringType]);

// Explicit type cast required.
type BigTuple = [string, string, string, string, string, string];
const bigTupleType: Type<BigTuple> = tupleOf([stringType, stringType, stringType, stringType, stringType, stringType]) as Type[BigTuple];
```


### `shapeOf()`

A container `Type` representing a heterogenous object of other `Type`s.

``` ts
shapeOf(types: ObjectOf<Type<Object>>): Type<ObjectOf<Object>>;
```

**Typescript note:** Due to lack of support in the Typescript compiler, an explicit type cast is always required.

``` ts
interface MyShape {
    foo: string;
    bar: number;
}

// Explicit type cast required.
const myShapeType: Type<MyShape> = shapeOf({
    foo: stringType,
    bar: stringType,
}) as Type<MyShape>;
```


### `referenceOf()`

A reference `Type`, representing a reference to another `Type`.

``` ts
referenceOf<T>(getType: () => Type<T>): Type<T>;
```

Use this to implement circular references in `Type`s.

``` js
const circularType = shapeOf({
    title: stringType,
    children: arrayOf(referenceOf(circularType)),
});
```


## Build status

This project is built on every push using the Travis-CI service.

[![Build Status](https://travis-ci.org/etianen/js-types.svg?branch=master)](https://travis-ci.org/etianen/js-types)


## Support and announcements

Downloads and bug tracking can be found at the [main project website](http://github.com/etianen/js-types).


## More information

This project was developed by Dave Hall. You can get the code
from the [project site](http://github.com/etianen/js-types).

Dave Hall is a freelance web developer, based in Cambridge, UK. You can usually
find him on the Internet:

- [Website](http://www.etianen.com/)
- [Google Profile](http://www.google.com/profiles/david.etianen)
