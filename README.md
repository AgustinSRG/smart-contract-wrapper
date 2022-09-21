# Smart Contract Wrapper

[![npm version](https://badge.fury.io/js/%40asanrom%2Fsmart-contract-wrapper.svg)](https://badge.fury.io/js/%40asanrom%2Fsmart-contract-wrapper)

Typescript wrapper for smart contract interaction.

This is a library to interact with Ethereum EVM using the json-RPC API. It allows both calling pure and view methods and also sending transactions.

## Installation

If you are using a npm managed project use:

```
npm install @asanrom/smart-contract-wrapper
```

## Usage

This library exports various utilities, along with the class `SmartContractInterface`, that allows the interaction with smart contracts using the ABI definition.

Using this class you can create a class for a smart contract, implementing the methods you want to use, here is an example: [ERC20 Contract Wrapper](https://github.com/AgustinSRG/smart-contract-wrapper/blob/master/tests/utils/erc20.ts)

## Documentation

 - [Library documentation (Auto-generated)](https://agustinsrg.github.io/smart-contract-wrapper/docs)

## Contract wrapper generator

For automatic generation of a smart contract wrappers, use the following utility:

 - [Smart contract wrapper generator](https://agustinsrg.github.io/smart-contract-wrapper/codegen)
