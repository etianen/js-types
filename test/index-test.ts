import {expect} from "chai";
import {ObjectOf, Type, stringType, numberType, booleanType, intersectionOf, nullableOf, undefinedOf, arrayOf, objectOf, tupleOf, shapeOf} from "../lib/index";


describe("types", () => {

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

    });

    describe("nullableOf", () => {

        const nullableStringType: Type<string> = nullableOf(stringType);

        it("has a descriptive name", () => {
            expect(nullableStringType.getName()).to.equal("string | null");
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

    });

    describe("undefinedOf", () => {

        const undefinedStringType: Type<string> = undefinedOf(stringType);

        it("has a descriptive name", () => {
            expect(undefinedStringType.getName()).to.equal("string | undefined");
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

    });

    describe("objectOf", () => {

        const stringObjectType: Type<ObjectOf<string>> = objectOf(stringType);

        it("has a descriptive name", () => {
            expect(stringObjectType.getName()).to.equal("ObjectOf<string>");
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

    });

    describe("shapeOf", () => {

        const numberStringShapeType: Type<{foo: number, bar: string}> = shapeOf({foo: numberType, bar: stringType});

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

    });

});
