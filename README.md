# @etianen/types

Runtime type checking of untrusted data.


## Installing

``` bash
npm install '@etianen/types'
```


## Overview

When receiving JSON data from an untrusted source, it's tempting to just assume the data is of the expected type and shape. This can lead to confusing errors appearing deep in your code.

@etianen/types provides a mechanism to check that untrusted data is the correct shape, or throw a useful debugging message.


### Describing data

@etianen/types provides a simple, composable way of describing the shape of data you expect.

``` js
import {numberType, arrayOf, objectOf} from "@etianen/types";

const numberObjectType = objectOf(numberType);

const listOfNumberObjectType = arrayOf(modelType);
```

In Typescript:

``` ts
import {Type, ObjectOf, numberType, arrayOf, objectOf} from "@etianen/types";

const numberObjectType: Type<ObjectOf<number>> = objectOf(numberType);

const listOfNumberObjectType: Type<Array<ObjectOf<number>>> = arrayOf(modelType);
```

See the list of [built-in types](#built-in-types) for more ways of describing data.


### Testing data

You can check that data is of the correct shape using the `isTypeOf()` method.

``` js
const untrustedData = JSON.parse('[{foo: "bar"}]');

if (listOfNumberObjectType.isTypeOf(untrustedData)) {
    // The data is the correct type.
    const foo = untrustedData[0].foo;
} else {
    // Output a useful debugging message to the console.
    console.warn(`Expected ${listOfNumberObjectType.getName()}`);
}
```

In Typescript:

``` js
// We cast to `Object`, rather than `any` to strictly type unknown data.
const untrustedData: Object = JSON.parse('[{foo: "bar"}]');

if (listOfNumberObjectType.isTypeOf(untrustedData)) {
    // `isTypeOf()` is a type guard, so `untrustedData` is of the expected
    // type within this block
    const foo: string = untrustedData[0].foo;
} else {
    // Output a useful debugging message to the console.
    console.warn(`Expected ${listOfNumberObjectType.getName()}`);
}
```

See the [type-checking API](#type-checking-api) for more information.


## Type-checking API

### Type.isTypeOf()

Checks that the value is of this `Type`.

``` ts
Type.isTypeOf<T>(value: Object): value is T;
```

Example:

``` js
import {stringType} from "@etianen/types";
stringType.isTypeOf("foo");  // true
stringType.isTypeOf(1);  // false
```


### Type.getName()

Returns a descriptive name of this `Type`.

``` ts
Type.getName(): string;
```

Example:

``` js
import {stringType} from "@etianen/types";
stringType.getName();  // "string"
```


### fromJS()

Casts the value to the given `Type`, or throws a `ValueError`.

``` ts
fromJS<T>(value: Object, type: Type<T>): T;
```

Example:

``` js
import {fromJS, ValueError, stringType} from "@etianen/types";
fromJS("foo", stringType);  // "foo"
fromJS(1);  // throw ValueError("Expected string (received 1)");
```


### fromJSON()

Parses the JSON and casts to the given `Type`, or throws a `ValueError`.

``` ts
fromJSON<T>(value: Object, type: Type<T>): T;
```

Example:

``` js
import {fromJSON, ValueError, stringType} from "@etianen/types";
fromJSON('"foo"', stringType);  // "foo"
fromJSON('1');  // throw ValueError("Expected string (received 1)");
fromJSON('[');  // throw ValueError('Invalid JSON (received "[")');
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


## Build status

This project is built on every push using the Travis-CI service.

[![Build Status](https://travis-ci.org/etianen/types.svg?branch=master)](https://travis-ci.org/etianen/types)


## Support and announcements

Downloads and bug tracking can be found at the [main project website](http://github.com/etianen/types).


## More information

This project was developed by Dave Hall. You can get the code
from the [project site](http://github.com/etianen/types).

Dave Hall is a freelance web developer, based in Cambridge, UK. You can usually
find him on the Internet:

- [Website](http://www.etianen.com/)
- [Google Profile](http://www.google.com/profiles/david.etianen)
