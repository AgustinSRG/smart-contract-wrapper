// ERC20 contract wrapper

"use strict";

import { QuantityLike, BytesLike, TransactionSendingOptions, deploySmartContract, getTxBuildDetailsForDeploy, Address, Quantity, SmartContractEventWrapper, SmartContractEvent, MethodCallingOptions, AddressLike, MethodTransactionOptions, TransactionResult, SmartContractInterface, TransactionBuildDetails, BlockTag, RPCOptions, ABILike } from "../../src";

export class ERC20Wrapper {
    public address: Address;
    private _contractInterface: SmartContractInterface;

    public static async deploy(name_: string, symbol_: string, initialSupply_: QuantityLike, bytecode: BytesLike, options: TransactionSendingOptions): Promise<ERC20Wrapper> {
        const deployed = await deploySmartContract(bytecode, ERC20_ABI, [name_, symbol_, initialSupply_], 0, options);
        if (deployed.receipt.status > BigInt(0)) {
            return new ERC20Wrapper(deployed.result, options);
        } else {
            throw new Error("Transaction reverted");
        }
    }
    
    public static getDeployTxBuildDetails(name_: string, symbol_: string, initialSupply_: QuantityLike, bytecode: BytesLike): TransactionBuildDetails {
        return getTxBuildDetailsForDeploy(bytecode, ERC20_ABI, [name_, symbol_, initialSupply_], 0);
    }

    constructor(address: AddressLike, rpcOptions: RPCOptions) {
        this._contractInterface = new SmartContractInterface(address, ERC20_ABI, rpcOptions);
        this.address = this._contractInterface.address;
    }

    public async name(options?: MethodCallingOptions): Promise<string> {
        const __r: any = await this._contractInterface.callViewMethod("name", [], options || {});
        return __r[0]
    }

    public async symbol(options?: MethodCallingOptions): Promise<string> {
        const __r: any = await this._contractInterface.callViewMethod("symbol", [], options || {});
        return __r[0]
    }

    public async decimals(options?: MethodCallingOptions): Promise<Quantity> {
        const __r: any = await this._contractInterface.callViewMethod("decimals", [], options || {});
        return __r[0]
    }

    public async totalSupply(options?: MethodCallingOptions): Promise<Quantity> {
        const __r: any = await this._contractInterface.callViewMethod("totalSupply", [], options || {});
        return __r[0]
    }

    public async balanceOf(account: AddressLike, options?: MethodCallingOptions): Promise<Quantity> {
        const __r: any = await this._contractInterface.callViewMethod("balanceOf", [account], options || {});
        return __r[0]
    }

    public async allowance(owner: AddressLike, spender: AddressLike, options?: MethodCallingOptions): Promise<Quantity> {
        const __r: any = await this._contractInterface.callViewMethod("allowance", [owner, spender], options || {});
        return __r[0]
    }

    public async transfer(to: AddressLike, amount: QuantityLike, options: MethodTransactionOptions): Promise<TransactionResult<ERC20EventCollection>> {
        const __r = await this._contractInterface.callMutableMethod("transfer", [to, amount], options);
    
        if (__r.receipt.status > BigInt(0)) {
            const decodedEvents = this._contractInterface.parseTransactionLogs(__r.receipt.logs)
            return { receipt: __r.receipt, result: new ERC20EventCollection(decodedEvents) };
        } else {
            throw new Error("Transaction reverted");
        }
    }
    
    public transfer$txBuildDetails(to: AddressLike, amount: QuantityLike): TransactionBuildDetails {
        return this._contractInterface.encodeMutableMethod("transfer", [to, amount]);
    }

    public async approve(spender: AddressLike, amount: QuantityLike, options: MethodTransactionOptions): Promise<TransactionResult<ERC20EventCollection>> {
        const __r = await this._contractInterface.callMutableMethod("approve", [spender, amount], options);
    
        if (__r.receipt.status > BigInt(0)) {
            const decodedEvents = this._contractInterface.parseTransactionLogs(__r.receipt.logs)
            return { receipt: __r.receipt, result: new ERC20EventCollection(decodedEvents) };
        } else {
            throw new Error("Transaction reverted");
        }
    }
    
    public approve$txBuildDetails(spender: AddressLike, amount: QuantityLike): TransactionBuildDetails {
        return this._contractInterface.encodeMutableMethod("approve", [spender, amount]);
    }

    public async transferFrom(from: AddressLike, to: AddressLike, amount: QuantityLike, options: MethodTransactionOptions): Promise<TransactionResult<ERC20EventCollection>> {
        const __r = await this._contractInterface.callMutableMethod("transferFrom", [from, to, amount], options);
    
        if (__r.receipt.status > BigInt(0)) {
            const decodedEvents = this._contractInterface.parseTransactionLogs(__r.receipt.logs)
            return { receipt: __r.receipt, result: new ERC20EventCollection(decodedEvents) };
        } else {
            throw new Error("Transaction reverted");
        }
    }
    
    public transferFrom$txBuildDetails(from: AddressLike, to: AddressLike, amount: QuantityLike): TransactionBuildDetails {
        return this._contractInterface.encodeMutableMethod("transferFrom", [from, to, amount]);
    }

    public async increaseAllowance(spender: AddressLike, addedValue: QuantityLike, options: MethodTransactionOptions): Promise<TransactionResult<ERC20EventCollection>> {
        const __r = await this._contractInterface.callMutableMethod("increaseAllowance", [spender, addedValue], options);
    
        if (__r.receipt.status > BigInt(0)) {
            const decodedEvents = this._contractInterface.parseTransactionLogs(__r.receipt.logs)
            return { receipt: __r.receipt, result: new ERC20EventCollection(decodedEvents) };
        } else {
            throw new Error("Transaction reverted");
        }
    }
    
    public increaseAllowance$txBuildDetails(spender: AddressLike, addedValue: QuantityLike): TransactionBuildDetails {
        return this._contractInterface.encodeMutableMethod("increaseAllowance", [spender, addedValue]);
    }

    public async decreaseAllowance(spender: AddressLike, subtractedValue: QuantityLike, options: MethodTransactionOptions): Promise<TransactionResult<ERC20EventCollection>> {
        const __r = await this._contractInterface.callMutableMethod("decreaseAllowance", [spender, subtractedValue], options);
    
        if (__r.receipt.status > BigInt(0)) {
            const decodedEvents = this._contractInterface.parseTransactionLogs(__r.receipt.logs)
            return { receipt: __r.receipt, result: new ERC20EventCollection(decodedEvents) };
        } else {
            throw new Error("Transaction reverted");
        }
    }
    
    public decreaseAllowance$txBuildDetails(spender: AddressLike, subtractedValue: QuantityLike): TransactionBuildDetails {
        return this._contractInterface.encodeMutableMethod("decreaseAllowance", [spender, subtractedValue]);
    }

    public async findEvents(fromBlock: QuantityLike | BlockTag, toBlock: QuantityLike | BlockTag): Promise<ERC20EventCollection> {
        const events = await this._contractInterface.findEvents(fromBlock, toBlock);
        return new ERC20EventCollection(events);
    }
}

export type ERC20EventType = "Transfer" | "Approval";

export class ERC20EventCollection {
    public events: SmartContractEvent[];
    constructor(events: SmartContractEvent[]) {
        this.events = events;
    }

    public length(): number {
        return this.events.length
    }

    public getEventType(index: number): ERC20EventType {
        return <any>this.events[index].name
    }

    public filter(eventType: ERC20EventType): ERC20EventCollection {
        return new ERC20EventCollection(this.events.filter(event => event.name === eventType));
    }

    public getTransferEvent(index: number): SmartContractEventWrapper<TransferEvent> {
        const __r: any = this.events[index].parameters;
        return {
            event: this.events[index],
            data: {
                from: __r[0],
                to: __r[1],
                value: __r[2],
            },
        };
    }

    public getApprovalEvent(index: number): SmartContractEventWrapper<ApprovalEvent> {
        const __r: any = this.events[index].parameters;
        return {
            event: this.events[index],
            data: {
                owner: __r[0],
                spender: __r[1],
                value: __r[2],
            },
        };
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

export const ERC20_ABI: ABILike = [
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
