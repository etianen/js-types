import {expect} from "chai";
import {Type, stringType, numberType, booleanType, nullableOf, arrayOf, objectOf, tupleOf, shapeOf} from "../lib/index";


describe("types", () => {

    const values: Array<[string, Array<any>]> = [
        ["string", ["", "foo", "0", "1", "true", "false"]],
        ["number", [0, 1, -1]],
        ["boolean", [false, true]],
        ["null", [null]],
        ["string array", [["foo", "bar"]]],
        ["number array", [[1, 2, 3], []]],
        ["string object", [{foo: "foo", bar: "bar"}]],
        ["number object", [{foo: 1, bar: 2}, {}]],
        ["number string tuple", [[1, "one"]]],
        ["number tuple", [[1]]],
        ["string string tuple", [["foo", "bar"]]],
        ["number string shape", [{foo: 1, bar: "bar"}]],
        ["number number shape", [{foo: 1, bar: 1}]],
        ["number shape", [{foo: 1}]],
        ["undefined", [undefined]],
    ];

    function describeType(name: string, type: Type<any>, validTypeNames: Array<string>): void {
        // Test the name.
        it("provides a descriptive name", () => {
            expect(type.getName()).to.equal(name);
        });
        // Test it passes values.
        values.forEach(([typeName, typeValues]: [string, Array<any>]) => {
            if (validTypeNames.indexOf(typeName) === -1) {
                it(`fails ${typeName}`, () => {
                    typeValues.forEach((value: any) => {
                        expect(type.isTypeOf(value)).to.be.false;
                    });
                });
                it(`errors on conversion from ${typeName}`, () => {
                    typeValues.forEach((value: any) => {
                        expect(() => type.from(value)).to.throw(TypeError, `Expected ${name}, received ${value}`);
                    });
                });
            } else {
                it(`passes ${typeName}`, () => {
                    typeValues.forEach((value: any) => {
                        expect(type.isTypeOf(value)).to.be.true;
                    });
                });
                it(`converts from ${typeName}`, () => {
                    typeValues.forEach((value: any) => {
                        expect(type.from(value)).to.equal(value);
                    });
                });
                it("allows a default conversion value", () => {
                    typeValues.forEach((value: any) => {
                        expect(type.from(undefined, value)).to.equal(value);
                    });
                });
            }
        });
    }

    describe("stringType", () => {

        describeType("string", stringType, ["string"]);

    });

    describe("numberType", () => {

        describeType("number", numberType, ["number"]);

    });

    describe("booleanType", () => {

        describeType("boolean", booleanType, ["boolean"]);

    });

    describe("nullableOf", () => {

        describeType("number?", nullableOf(numberType), ["number", "null"]);

    });

    describe("arrayOf", () => {

        describeType("Array<number>", arrayOf(numberType), ["number array", "number tuple"]);

    });

    describe("objectOf", () => {

        describeType("Object<number>", objectOf(numberType), ["number object", "number number shape", "number shape"]);

    });

    describe("tupleOf", () => {

        describeType("[number, string]", tupleOf([numberType, stringType]), ["number string tuple"]);

    });

    describe("shapeOf", () => {

        describeType("{foo: number, bar: string}", shapeOf({foo: numberType, bar: stringType}), ["number string shape"]);

    });

});
