import {expect} from "chai";
import {ObjectOf, ValueError, Type, fromJS, fromJSON, anyType, stringType, numberType, booleanType, referenceOf, intersectionOf, unionOf, nullableOf, optionalOf, arrayOf, objectOf, tupleOf, shapeOf} from "../lib/index";


describe("types", () => {

    describe("fromJS", () => {

        it("casts to expected type", () => {
            const value: Object = ["foo"];
            const stringValue: Array<string> = fromJS(value, arrayOf(stringType));
            // We use strict equal here, as the original array should not have been altered.
            expect(value).to.eql(stringValue);
        });

        it("errors on unexpected type", () => {
            expect(() => fromJS([1], arrayOf(stringType))).to.throw(ValueError, "Expected Array<string> (received [1])");
        });

    });

    describe("fromJSON", () => {

        it("decodes to expected type", () => {
            const value: string = '["foo"]';
            const decodedValue: Array<string> = fromJSON(value, arrayOf(stringType));
            expect(decodedValue).to.eql(["foo"]);
        });

        it("errors on unexpected type", () => {
            expect(() => fromJSON("[1]", arrayOf(stringType))).to.throw(ValueError, "Expected Array<string> (received [1])");
        });

        it("erors on invalid JSON", () => {
            expect(() => fromJSON("[", arrayOf(stringType))).to.throw(ValueError, 'Invalid JSON (received "[")');
        });

    });

    describe("referenceOf", () => {

        const referenceOfStringType: Type<string> = referenceOf(() => stringType);

        it("has a descriptive name", () => {
            expect(referenceOfStringType.getName()).to.equal("…");
        });

        it("passes values of wrapped type", () => {
            expect(referenceOfStringType.isTypeOf("foo")).to.be.true;
        });

        it("fails values not of wrapped type", () => {
            expect(referenceOfStringType.isTypeOf(1)).to.be.false;
            expect(referenceOfStringType.isTypeOf(true)).to.be.false;
            expect(referenceOfStringType.isTypeOf({})).to.be.false;
            expect(referenceOfStringType.isTypeOf([])).to.be.false;
        });

        it("fails nulls", () => {
            expect(referenceOfStringType.isTypeOf(null)).to.be.false;
        });

        it("fails undefined", () => {
            expect(referenceOfStringType.isTypeOf(undefined)).to.be.false;
        });

        it("checks value equality", () => {
            expect(referenceOfStringType.equals("foo", "foo")).to.be.true;
            expect(referenceOfStringType.equals("foo", "bar")).to.be.false;
        });

    });

    describe("anyType", () => {

        it("has a descriptive name", () => {
            expect(anyType.getName()).to.equal("any");
        });

        it("passes all values", () => {
            expect(anyType.isTypeOf("")).to.be.true;
            expect(anyType.isTypeOf("foo")).to.be.true;
            expect(anyType.isTypeOf(1)).to.be.true;
            expect(anyType.isTypeOf(true)).to.be.true;
            expect(anyType.isTypeOf({})).to.be.true;
            expect(anyType.isTypeOf([])).to.be.true;
        });

        it("fails nulls", () => {
            expect(anyType.isTypeOf(null)).to.be.false;
        });

        it("fails undefined", () => {
            expect(anyType.isTypeOf(undefined)).to.be.false;
        });

        it("checks value equality", () => {
            expect(anyType.equals("foo", "foo")).to.be.true;
            expect(anyType.equals("foo", 1)).to.be.false;
        });

    });

    describe("stringType", () => {

        it("has a descriptive name", () => {
            expect(stringType.getName()).to.equal("string");
        });

        it("passes strings", () => {
            expect(stringType.isTypeOf("")).to.be.true;
            expect(stringType.isTypeOf("foo")).to.be.true;
        });

        it("fails non-strings", () => {
            expect(stringType.isTypeOf(1)).to.be.false;
            expect(stringType.isTypeOf(true)).to.be.false;
            expect(stringType.isTypeOf({})).to.be.false;
            expect(stringType.isTypeOf([])).to.be.false;
        });

        it("fails nulls", () => {
            expect(stringType.isTypeOf(null)).to.be.false;
        });

        it("fails undefined", () => {
            expect(stringType.isTypeOf(undefined)).to.be.false;
        });

        it("checks value equality", () => {
            expect(stringType.equals("foo", "foo")).to.be.true;
            expect(stringType.equals("foo", "bar")).to.be.false;
        });

    });

    describe("numberType", () => {

        it("has a descriptive name", () => {
            expect(numberType.getName()).to.equal("number");
        });

        it("passes numbers", () => {
            expect(numberType.isTypeOf(0)).to.be.true;
            expect(numberType.isTypeOf(1)).to.be.true;
            expect(numberType.isTypeOf(-1)).to.be.true;
        });

        it("fails non-numbers", () => {
            expect(numberType.isTypeOf("foo")).to.be.false;
            expect(numberType.isTypeOf(true)).to.be.false;
            expect(numberType.isTypeOf({})).to.be.false;
            expect(numberType.isTypeOf([])).to.be.false;
        });

        it("fails nulls", () => {
            expect(numberType.isTypeOf(null)).to.be.false;
        });

        it("fails undefined", () => {
            expect(numberType.isTypeOf(undefined)).to.be.false;
        });

        it("checks value equality", () => {
            expect(numberType.equals(1, 1)).to.be.true;
            expect(numberType.equals(1, 2)).to.be.false;
        });

    });

    describe("booleanType", () => {

        it("has a descriptive name", () => {
            expect(booleanType.getName()).to.equal("boolean");
        });

        it("passes booleans", () => {
            expect(booleanType.isTypeOf(true)).to.be.true;
            expect(booleanType.isTypeOf(false)).to.be.true;
        });

        it("fails non-booleans", () => {
            expect(booleanType.isTypeOf("foo")).to.be.false;
            expect(booleanType.isTypeOf(1)).to.be.false;
            expect(booleanType.isTypeOf({})).to.be.false;
            expect(booleanType.isTypeOf([])).to.be.false;
        });

        it("fails nulls", () => {
            expect(booleanType.isTypeOf(null)).to.be.false;
        });

        it("fails undefined", () => {
            expect(booleanType.isTypeOf(undefined)).to.be.false;
        });

        it("checks value equality", () => {
            expect(booleanType.equals(true, true)).to.be.true;
            expect(booleanType.equals(true, false)).to.be.false;
        });

    });

    describe("intersectionOf", () => {

        const stringOrNumberType: Type<string | number> = intersectionOf(stringType, numberType);

        it("has a descriptive name", () => {
            expect(stringOrNumberType.getName()).to.equal("string | number");
        });

        it("passes values of any wrapped type", () => {
            expect(stringOrNumberType.isTypeOf("foo")).to.be.true;
            expect(stringOrNumberType.isTypeOf(5)).to.be.true;
        });

        it("fails values not of wrapped type", () => {
            expect(stringOrNumberType.isTypeOf(true)).to.be.false;
            expect(stringOrNumberType.isTypeOf({})).to.be.false;
            expect(stringOrNumberType.isTypeOf([])).to.be.false;
        });

        it("fails nulls", () => {
            expect(stringOrNumberType.isTypeOf(null)).to.be.false;
        });

        it("fails undefined", () => {
            expect(stringOrNumberType.isTypeOf(undefined)).to.be.false;
        });

        it("checks value equality", () => {
            expect(stringOrNumberType.equals("foo", "foo")).to.be.true;
            expect(stringOrNumberType.equals("foo", "bar")).to.be.false;
            expect(stringOrNumberType.equals(1, 1)).to.be.true;
            expect(stringOrNumberType.equals(1, 2)).to.be.false;
            expect(stringOrNumberType.equals("foo", 1)).to.be.false;
        });

    });

    describe("unionOf", () => {

        interface StringShape {
            foo: string;
        }

        interface NumberShape {
            bar: number;
        }

        const stringShapeType: Type<StringShape> = shapeOf({foo: stringType}) as Type<StringShape>;

        const numberShapeType: Type<NumberShape> = shapeOf({bar: numberType}) as Type<NumberShape>;

        const stringNumberShapeType: Type<StringShape & NumberShape> = unionOf(stringShapeType, numberShapeType);

        it("has a descriptive name", () => {
            expect(stringNumberShapeType.getName()).to.equal("{foo: string} & {bar: number}");
        });

        it("passes values of both wrapped types", () => {
            expect(stringNumberShapeType.isTypeOf({foo: "foo", bar: 1})).to.be.true;
        });

        it("fails values not of wrapped type", () => {
            expect(stringNumberShapeType.isTypeOf("foo")).to.be.false;
            expect(stringNumberShapeType.isTypeOf(1)).to.be.false;
            expect(stringNumberShapeType.isTypeOf(true)).to.be.false;
            expect(stringNumberShapeType.isTypeOf({})).to.be.false;
            expect(stringNumberShapeType.isTypeOf([])).to.be.false;
        });

        it("fails values matching only one type", () => {
            expect(stringNumberShapeType.isTypeOf({foo: "foo"})).to.be.false;
        });

        it("fails undefined", () => {
            expect(stringNumberShapeType.isTypeOf(undefined)).to.be.false;
        });

        it("checks value equality", () => {
            expect(stringNumberShapeType.equals({foo: "foo", bar: 1}, {foo: "foo", bar: 1})).to.be.true;
            expect(stringNumberShapeType.equals({foo: "foo", bar: 1}, {foo: "bar", bar: 1})).to.be.false;
            expect(stringNumberShapeType.equals({foo: "foo", bar: 1}, {foo: "foo", bar: 2})).to.be.false;
        });

    });

    describe("nullableOf", () => {

        const nullableStringType: Type<string> = nullableOf(stringType);

        it("has a descriptive name", () => {
            expect(nullableStringType.getName()).to.equal("string");
        });

        it("passes values of wrapped type", () => {
            expect(nullableStringType.isTypeOf("foo")).to.be.true;
        });

        it("fails values not of wrapped type", () => {
            expect(nullableStringType.isTypeOf(1)).to.be.false;
            expect(nullableStringType.isTypeOf(true)).to.be.false;
            expect(nullableStringType.isTypeOf({})).to.be.false;
            expect(nullableStringType.isTypeOf([])).to.be.false;
        });

        it("passes nulls", () => {
            expect(nullableStringType.isTypeOf(null)).to.be.true;
        });

        it("fails undefined", () => {
            expect(nullableStringType.isTypeOf(undefined)).to.be.false;
        });

        it("checks value equality", () => {
            expect(nullableStringType.equals("foo", "foo")).to.be.true;
            expect(nullableStringType.equals("foo", "bar")).to.be.false;
            expect(nullableStringType.equals(null, null)).to.be.true;
            expect(nullableStringType.equals("foo", null)).to.be.false;
        });

    });

    describe("optionalOf()", () => {

        const undefinedStringType: Type<string> = optionalOf(stringType);

        it("has a descriptive name", () => {
            expect(undefinedStringType.getName()).to.equal("string?");
        });

        it("passes values of wrapped type", () => {
            expect(undefinedStringType.isTypeOf("")).to.be.true;
            expect(undefinedStringType.isTypeOf("foo")).to.be.true;
        });

        it("fails values not of wrapped type", () => {
            expect(undefinedStringType.isTypeOf(1)).to.be.false;
            expect(undefinedStringType.isTypeOf(true)).to.be.false;
            expect(undefinedStringType.isTypeOf({})).to.be.false;
            expect(undefinedStringType.isTypeOf([])).to.be.false;
        });

        it("fails nulls", () => {
            expect(undefinedStringType.isTypeOf(null)).to.be.false;
        });

        it("passes undefined", () => {
            expect(undefinedStringType.isTypeOf(undefined)).to.be.true;
        });

        it("checks value equality", () => {
            expect(undefinedStringType.equals("foo", "foo")).to.be.true;
            expect(undefinedStringType.equals("foo", "bar")).to.be.false;
            expect(undefinedStringType.equals(undefined, undefined)).to.be.true;
            expect(undefinedStringType.equals("foo", undefined)).to.be.false;
        });

    });

    describe("arrayOf", () => {

        const stringArrayType: Type<Array<string>> = arrayOf(stringType);

        it("has a descriptive name", () => {
            expect(stringArrayType.getName()).to.equal("Array<string>");
        });

        it("passes arrays of value type", () => {
            expect(stringArrayType.isTypeOf(["foo"])).to.be.true;
        });

        it("passes empty arrays", () => {
            expect(stringArrayType.isTypeOf([])).to.be.true;
        });

        it("fails non-arrays", () => {
            expect(stringArrayType.isTypeOf("")).to.be.false;
            expect(stringArrayType.isTypeOf(1)).to.be.false;
            expect(stringArrayType.isTypeOf(true)).to.be.false;
            expect(stringArrayType.isTypeOf({})).to.be.false;
        });

        it("fails nulls", () => {
            expect(stringArrayType.isTypeOf(null)).to.be.false;
        });

        it("fails undefined", () => {
            expect(stringArrayType.isTypeOf(undefined)).to.be.false;
        });

        it("fails arrays of incorrect value type", () => {
            expect(stringArrayType.isTypeOf([1])).to.be.false;
        });

        it("checks value equality", () => {
            expect(stringArrayType.equals(["foo"], ["foo"])).to.be.true;
            expect(stringArrayType.equals(["foo"], ["bar"])).to.be.false;
            expect(stringArrayType.equals([], [])).to.be.true;
            expect(stringArrayType.equals(["foo"], [])).to.be.false;
            expect(stringArrayType.equals(["foo"], ["foo", "bar"])).to.be.false;
        });

    });

    describe("objectOf", () => {

        const stringObjectType: Type<ObjectOf<string>> = objectOf(stringType);

        it("has a descriptive name", () => {
            expect(stringObjectType.getName()).to.equal("Object<string>");
        });

        it("passes objects of value type", () => {
            expect(stringObjectType.isTypeOf({foo: "foo"})).to.be.true;
        });

        it("passes empty objects", () => {
            expect(stringObjectType.isTypeOf({})).to.be.true;
        });

        it("fails non-objects", () => {
            expect(stringObjectType.isTypeOf("")).to.be.false;
            expect(stringObjectType.isTypeOf(1)).to.be.false;
            expect(stringObjectType.isTypeOf(true)).to.be.false;
            expect(stringObjectType.isTypeOf([])).to.be.false;
        });

        it("fails nulls", () => {
            expect(stringObjectType.isTypeOf(null)).to.be.false;
        });

        it("fails undefined", () => {
            expect(stringObjectType.isTypeOf(undefined)).to.be.false;
        });

        it("fails objects of incorrect value type", () => {
            expect(stringObjectType.isTypeOf({foo: 1})).to.be.false;
        });

        it("checks value equality", () => {
            expect(stringObjectType.equals({foo: "foo"}, {foo: "foo"})).to.be.true;
            expect(stringObjectType.equals({foo: "foo"}, {foo: "bar"})).to.be.false;
            expect(stringObjectType.equals({}, {})).to.be.true;
            expect(stringObjectType.equals({foo: "foo"}, {})).to.be.false;
            expect(stringObjectType.equals({foo: "foo"}, {foo: "foo", bar: "bar"})).to.be.false;
        });

    });

    describe("tupleOf", () => {

        const numberStringTupleType: Type<[number, string]> = tupleOf([numberType, stringType]);

        it("has a descriptive name", () => {
            expect(numberStringTupleType.getName()).to.equal("[number, string]");
        });

        it("passes tuples of value types", () => {
            expect(numberStringTupleType.isTypeOf([1, "foo"])).to.be.true;
        });

        it("fails empty tuples", () => {
            expect(numberStringTupleType.isTypeOf([])).to.be.false;
        });

        it("fails non-tuples", () => {
            expect(numberStringTupleType.isTypeOf("")).to.be.false;
            expect(numberStringTupleType.isTypeOf(1)).to.be.false;
            expect(numberStringTupleType.isTypeOf(true)).to.be.false;
            expect(numberStringTupleType.isTypeOf({})).to.be.false;
        });

        it("fails nulls", () => {
            expect(numberStringTupleType.isTypeOf(null)).to.be.false;
        });

        it("fails undefined", () => {
            expect(numberStringTupleType.isTypeOf(undefined)).to.be.false;
        });

        it("fails tuples of incorrect value type", () => {
            expect(numberStringTupleType.isTypeOf([1, 0])).to.be.false;
        });

        it("fails tuples missing value types", () => {
            expect(numberStringTupleType.isTypeOf([1])).to.be.false;
        });

        it("checks value equality", () => {
            expect(numberStringTupleType.equals([1, "foo"], [1, "foo"])).to.be.true;
            expect(numberStringTupleType.equals([1, "foo"], [1, "bar"])).to.be.false;
            expect(numberStringTupleType.equals([1, "foo"], [2, "foo"])).to.be.false;
        });

    });

    describe("shapeOf", () => {

        interface NumberStringShape {
            foo: number;
            bar: string;
        }

        const numberStringShapeType: Type<NumberStringShape> = shapeOf({foo: numberType, bar: stringType}) as Type<NumberStringShape>;

        it("has a descriptive name", () => {
            expect(numberStringShapeType.getName()).to.equal("{foo: number, bar: string}");
        });

        it("passes shapes of value type", () => {
            expect(numberStringShapeType.isTypeOf({foo: 1, bar: "bar"})).to.be.true;
        });

        it("fails empty shapes", () => {
            expect(numberStringShapeType.isTypeOf({})).to.be.false;
        });

        it("fails non-shapes", () => {
            expect(numberStringShapeType.isTypeOf("")).to.be.false;
            expect(numberStringShapeType.isTypeOf(1)).to.be.false;
            expect(numberStringShapeType.isTypeOf(true)).to.be.false;
            expect(numberStringShapeType.isTypeOf([])).to.be.false;
        });

        it("fails nulls", () => {
            expect(numberStringShapeType.isTypeOf(null)).to.be.false;
        });

        it("fails undefined", () => {
            expect(numberStringShapeType.isTypeOf(undefined)).to.be.false;
        });

        it("fails shapes of incorrect value type", () => {
            expect(numberStringShapeType.isTypeOf({foo: 1, bar: 1})).to.be.false;
        });

        it("fails shapes missing value types", () => {
            expect(numberStringShapeType.isTypeOf({foo: 1})).to.be.false;
        });

        it("checks value equality", () => {
            expect(numberStringShapeType.equals({foo: 1, bar: "bar"}, {foo: 1, bar: "bar"})).to.be.true;
            expect(numberStringShapeType.equals({foo: 1, bar: "bar"}, {foo: 1, bar: "foo"})).to.be.false;
            expect(numberStringShapeType.equals({foo: 1, bar: "bar"}, {foo: 2, bar: "bar"})).to.be.false;
        });

    });

});
