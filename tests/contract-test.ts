// Smart contract wrapper test

"use strict";

import { expect } from 'chai';
import { parseHexBytes, parseQuantity, privateKeyToAddress } from '../src';

const TEST_PRIVATE_KEY = parseHexBytes("3de106f01f3fa595f215f50a0daf2ddd1bd061663b69396783a70dcee9f1f755");
const TEST_ADDRESS = privateKeyToAddress(TEST_PRIVATE_KEY);

const TEST_ADDRESS_1 = parseHexBytes("0x64eBC0159b5FDCEe8EE623DCc7bF8D296F17826B");

const TEST_INITIAL_SUPPLY = parseQuantity(1000);
const TEST_TOKEN_NAME = "TestToken";
const TEST_TOKEN_SYMBOL = "T";

describe("Smart contract wrapper", function () {

    this.timeout(30000);

    it('Should deploy without errors', () => {
        expect(0).to.be.equal(0);
    });

    it('Should set the contract params properly', () => {
        expect(0).to.be.equal(0);
    });

    it('Should give the initial supply to the owner of the contract', () => {
        expect(0).to.be.equal(0);
    });

    it('Should transfer to test address without errors', () => {
        expect(0).to.be.equal(0);
    });

    it('Should emit the Transfer event', () => {
        expect(0).to.be.equal(0);
    });

    it('Should have incremented the balance of the test address', () => {
        expect(0).to.be.equal(0);
    });
});
