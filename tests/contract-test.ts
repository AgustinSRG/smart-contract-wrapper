// Smart contract wrapper test

"use strict";

import { expect } from 'chai';
import { parseAddress, parseBytes, parseQuantity, privateKeyToAddress, RPC_HTTP_Provider, RPC_WebSocket_Provider } from '../src';
import { ERC20Wrapper, TransferEvent } from "./utils/erc20"
import { ERC20_BYTECODE } from './utils/erc20-data';

const DEBUG_MODE = false;

const RPC_URL = "http://localhost:8545";
const RPC_WS_URL = "ws://localhost:8546"

const TEST_PRIVATE_KEY = parseBytes("3de106f01f3fa595f215f50a0daf2ddd1bd061663b69396783a70dcee9f1f755");
const TEST_ADDRESS = privateKeyToAddress(TEST_PRIVATE_KEY);

const TEST_ADDRESS_1 = parseAddress("0x64eBC0159b5FDCEe8EE623DCc7bF8D296F17826B");

const TEST_INITIAL_SUPPLY = parseQuantity(1000);
const TEST_TOKEN_NAME = "TestToken";
const TEST_TOKEN_SYMBOL = "T";

const RPC_PROVIDERS = [
    {
        name: "No provider",
        provider: undefined,
    },
    {
        name: "HTTP Provider",
        provider: new RPC_HTTP_Provider(RPC_URL),
    },
    {
        name: "Websocket Provider",
        provider: (new RPC_WebSocket_Provider(RPC_WS_URL)).on("error", (err => {
            console.error(err);
        })),
    },
];

for (let rpcProvider of RPC_PROVIDERS) {
    describe("Smart contract wrapper (" + rpcProvider.name + ")", function () {

        after(() => {
            if (rpcProvider.provider) {
                rpcProvider.provider.destroy();
            }
        });

        this.timeout(30000);
    
        let contract: ERC20Wrapper;
    
        it('Should deploy without errors', async () => {
            contract = await ERC20Wrapper.deploy(TEST_TOKEN_NAME, TEST_TOKEN_SYMBOL, TEST_INITIAL_SUPPLY, ERC20_BYTECODE, {
                provider: rpcProvider.provider,
                rpcURL: RPC_URL,
                privateKey: TEST_PRIVATE_KEY,
                isFeeMarket: true,
                logFunction: msg => {
                    if (DEBUG_MODE) {
                        console.log("[DEBUG] " + msg);
                    }
                },
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
    
        let event: TransferEvent;
        let blockNum: bigint;
    
        it('Should transfer to test address without errors', async () => {
            const res = await contract.transfer(TEST_ADDRESS_1, BigInt(1), {
                privateKey: TEST_PRIVATE_KEY,
                isFeeMarket: true,
                logFunction: msg => {
                    if (DEBUG_MODE) {
                        console.log("[DEBUG] " + msg);
                    }
                },
            });
    
            blockNum = res.receipt.blockNumber;
    
            event = res.result.filter("Transfer").getTransferEvent(0).data;
        });
    
        it('Should emit the Transfer event', () => {
            expect(event).not.to.be.null;
    
            if (event !== null) {
                expect(event.from.toUpperCase()).to.be.equal(TEST_ADDRESS.toUpperCase());
                expect(event.to.toUpperCase()).to.be.equal(TEST_ADDRESS_1.toUpperCase());
                expect(event.value).to.be.equal(BigInt(1));
            }
        });
    
        it('Should have incremented the balance of the test address', async () => {
            const bal = await contract.balanceOf(TEST_ADDRESS);
    
            expect(bal).to.be.equal(TEST_INITIAL_SUPPLY - BigInt(1));
    
            const bal1 = await contract.balanceOf(TEST_ADDRESS_1);
    
            expect(bal1).to.be.equal(BigInt(1));
        });
    
    
        it('Should have saved the transfer event', async () => {
            const events = await contract.findEvents(blockNum, blockNum);
    
            expect(events.length()).to.be.greaterThan(0);
    
            const transferEvent = events.filter("Transfer").getTransferEvent(0);
    
            expect(transferEvent.data.from.toUpperCase()).to.be.equal(TEST_ADDRESS.toUpperCase());
            expect(transferEvent.data.to.toUpperCase()).to.be.equal(TEST_ADDRESS_1.toUpperCase());
            expect(transferEvent.data.value).to.be.equal(BigInt(1));
        });
    });
}
