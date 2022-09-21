// ERC20 contract wrapper

"use strict";

import { QuantityLike, BytesLike, TransactionSendingOptions, deploySmartContract, Address, Quantity, MethodCallingOptions, AddressLike, MethodTransactionOptions, SmartContractEvent, TransactionResult, SmartContractInterface, RPCOptions, ABILike } from "../../src";

export class ERC20Wrapper {
    private _contractInterface: SmartContractInterface;

    public static async deploy(name_: string, symbol_: string, initialSupply_: QuantityLike, bytecode: BytesLike, options: TransactionSendingOptions): Promise<ERC20Wrapper> {
        const deployed = await deploySmartContract(bytecode, CONTRACT_ABI, [name_, symbol_, initialSupply_], 0, options);
        if (deployed.receipt.status > BigInt(0)) {
            return new ERC20Wrapper(deployed.result, options);
        } else {
            throw new Error("Transaction reverted");
        }
    }

    constructor(address: AddressLike, rpcOptions: RPCOptions) {
        this._contractInterface = new SmartContractInterface(address, CONTRACT_ABI, rpcOptions);
    }

    public async name(options?: MethodCallingOptions): Promise<string> {
        const result: any = await this._contractInterface.callViewMethod("name", [], options || {});
        return result[0]
    }

    public async symbol(options?: MethodCallingOptions): Promise<string> {
        const result: any = await this._contractInterface.callViewMethod("symbol", [], options || {});
        return result[0]
    }

    public async decimals(options?: MethodCallingOptions): Promise<Quantity> {
        const result: any = await this._contractInterface.callViewMethod("decimals", [], options || {});
        return result[0]
    }

    public async totalSupply(options?: MethodCallingOptions): Promise<Quantity> {
        const result: any = await this._contractInterface.callViewMethod("totalSupply", [], options || {});
        return result[0]
    }

    public async balanceOf(account: AddressLike, options?: MethodCallingOptions): Promise<Quantity> {
        const result: any = await this._contractInterface.callViewMethod("balanceOf", [account], options || {});
        return result[0]
    }

    public async allowance(owner: AddressLike, spender: AddressLike, options?: MethodCallingOptions): Promise<Quantity> {
        const result: any = await this._contractInterface.callViewMethod("allowance", [owner, spender], options || {});
        return result[0]
    }

    public async transfer(to: AddressLike, amount: QuantityLike, options: MethodTransactionOptions): Promise<TransactionResult<ERC20EventCollection>> {
        const result = await this._contractInterface.callMutableMethod("transfer", [to, amount], options);
    
        if (result.receipt.status > BigInt(0)) {
            const decodedEvents = this._contractInterface.parseTransactionLogs(result.receipt.logs)
            return { receipt: result.receipt, result: new ERC20EventCollection(decodedEvents) };
        } else {
            throw new Error("Transaction reverted");
        }
    }

    public async approve(spender: AddressLike, amount: QuantityLike, options: MethodTransactionOptions): Promise<TransactionResult<ERC20EventCollection>> {
        const result = await this._contractInterface.callMutableMethod("approve", [spender, amount], options);
    
        if (result.receipt.status > BigInt(0)) {
            const decodedEvents = this._contractInterface.parseTransactionLogs(result.receipt.logs)
            return { receipt: result.receipt, result: new ERC20EventCollection(decodedEvents) };
        } else {
            throw new Error("Transaction reverted");
        }
    }

    public async transferFrom(from: AddressLike, to: AddressLike, amount: QuantityLike, options: MethodTransactionOptions): Promise<TransactionResult<ERC20EventCollection>> {
        const result = await this._contractInterface.callMutableMethod("transferFrom", [from, to, amount], options);
    
        if (result.receipt.status > BigInt(0)) {
            const decodedEvents = this._contractInterface.parseTransactionLogs(result.receipt.logs)
            return { receipt: result.receipt, result: new ERC20EventCollection(decodedEvents) };
        } else {
            throw new Error("Transaction reverted");
        }
    }

    public async increaseAllowance(spender: AddressLike, addedValue: QuantityLike, options: MethodTransactionOptions): Promise<TransactionResult<ERC20EventCollection>> {
        const result = await this._contractInterface.callMutableMethod("increaseAllowance", [spender, addedValue], options);
    
        if (result.receipt.status > BigInt(0)) {
            const decodedEvents = this._contractInterface.parseTransactionLogs(result.receipt.logs)
            return { receipt: result.receipt, result: new ERC20EventCollection(decodedEvents) };
        } else {
            throw new Error("Transaction reverted");
        }
    }

    public async decreaseAllowance(spender: AddressLike, subtractedValue: QuantityLike, options: MethodTransactionOptions): Promise<TransactionResult<ERC20EventCollection>> {
        const result = await this._contractInterface.callMutableMethod("decreaseAllowance", [spender, subtractedValue], options);
    
        if (result.receipt.status > BigInt(0)) {
            const decodedEvents = this._contractInterface.parseTransactionLogs(result.receipt.logs)
            return { receipt: result.receipt, result: new ERC20EventCollection(decodedEvents) };
        } else {
            throw new Error("Transaction reverted");
        }
    }
}

export class ERC20EventCollection {
    public events: SmartContractEvent[];
    constructor(events: SmartContractEvent[]) {
        this.events = events;
    }

    public findTransferEvent(): TransferEvent | null {
        for (let event of this.events) {
            if (event.name === "Transfer") {
                const result: any = event.parameters;
                return {
                    from: result[0],
                    to: result[1],
                    value: result[2],
                }
            }
        }
        return null;
    }

    public findApprovalEvent(): ApprovalEvent | null {
        for (let event of this.events) {
            if (event.name === "Approval") {
                const result: any = event.parameters;
                return {
                    owner: result[0],
                    spender: result[1],
                    value: result[2],
                }
            }
        }
        return null;
    }
}

export interface TransferEvent {
    from: Address,
    to: Address,
    value: Quantity,
}

export interface ApprovalEvent {
    owner: Address,
    spender: Address,
    value: Quantity,
}

const CONTRACT_ABI: ABILike = [
    {
        "inputs": [
            {
                "name": "name_",
                "type": "string"
            },
            {
                "name": "symbol_",
                "type": "string"
            },
            {
                "name": "initialSupply_",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "spender",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "name": "",
                "type": "uint8"
            }
        ],
        "payable": false,
        "stateMutability": "pure",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "account",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "to",
                "type": "address"
            },
            {
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "owner",
                "type": "address"
            },
            {
                "name": "spender",
                "type": "address"
            }
        ],
        "name": "allowance",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "spender",
                "type": "address"
            },
            {
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "from",
                "type": "address"
            },
            {
                "name": "to",
                "type": "address"
            },
            {
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "transferFrom",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "spender",
                "type": "address"
            },
            {
                "name": "addedValue",
                "type": "uint256"
            }
        ],
        "name": "increaseAllowance",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "spender",
                "type": "address"
            },
            {
                "name": "subtractedValue",
                "type": "uint256"
            }
        ],
        "name": "decreaseAllowance",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }
];
