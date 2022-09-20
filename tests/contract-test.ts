// Smart contract wrapper test

"use strict";

import { expect } from 'chai';
import { outputToAddress, outputToQuantity, parseAddress, parseBytes, parseQuantity, privateKeyToAddress, SmartContractEvent, toHex } from '../src';
import { ERC20Contract } from "./utils/erc20"

const RPC_URL = "http://localhost:8545"

const TEST_PRIVATE_KEY = parseBytes("3de106f01f3fa595f215f50a0daf2ddd1bd061663b69396783a70dcee9f1f755");
const TEST_ADDRESS = privateKeyToAddress(TEST_PRIVATE_KEY);

const TEST_ADDRESS_1 = parseAddress("0x64eBC0159b5FDCEe8EE623DCc7bF8D296F17826B");

const TEST_INITIAL_SUPPLY = parseQuantity(1000);
const TEST_TOKEN_NAME = "TestToken";
const TEST_TOKEN_SYMBOL = "T";

const LOG_FUNC = function (txt: string) {
    console.log(`[DEBUG] ${txt}`);
};

describe("Smart contract wrapper", function () {

    this.timeout(30000);

    let contract: ERC20Contract;

    it('Should deploy without errors', async () => {
        contract = await ERC20Contract.deploy(TEST_TOKEN_NAME, TEST_TOKEN_SYMBOL, TEST_INITIAL_SUPPLY, {
            rpcURL: RPC_URL,
            privateKey: TEST_PRIVATE_KEY,
            isFeeMarket: true,
            logFunction: LOG_FUNC,
        });
    });

    it('Should set the contract params properly', async () => {
        const storedName = await contract.name();
        const storedSymbol = await contract.symbol();
        const storedInitialSupply = await contract.totalSupply();

        expect(storedName).to.be.equal(TEST_TOKEN_NAME);
        expect(storedSymbol).to.be.equal(TEST_TOKEN_SYMBOL);
        expect(storedInitialSupply).to.be.equal(TEST_INITIAL_SUPPLY);
    });

    it('Should give the initial supply to the owner of the contract', async () => {
        const bal = await contract.balanceOf(TEST_ADDRESS);

        expect(bal).to.be.equal(TEST_INITIAL_SUPPLY);
    });

    let event: SmartContractEvent;

    it('Should transfer to test address without errors', async () => {
        const res = await contract.transfer(TEST_ADDRESS_1, BigInt(1), {
            privateKey: TEST_PRIVATE_KEY,
            isFeeMarket: true,
            logFunction: LOG_FUNC,
        });

        event = res.result;
    });

    it('Should emit the Transfer event', () => {
        expect(event).not.to.be.null;
        expect(event.name).to.be.equal("Transfer");



        expect(outputToAddress(event.parameters[0]).toUpperCase()).to.be.equal(TEST_ADDRESS.toUpperCase());
        expect(outputToAddress(event.parameters[1]).toUpperCase()).to.be.equal(TEST_ADDRESS_1.toUpperCase());
        expect(outputToQuantity(event.parameters[2])).to.be.equal(BigInt(1));
    });

    it('Should have incremented the balance of the test address', async () => {
        const bal = await contract.balanceOf(TEST_ADDRESS);

        expect(bal).to.be.equal(TEST_INITIAL_SUPPLY - BigInt(1));

        const bal1 = await contract.balanceOf(TEST_ADDRESS_1);

        expect(bal1).to.be.equal(BigInt(1));
    });
});
