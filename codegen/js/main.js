// Main vue component

window.App = new Vue({
    el: "#app",

    data: {
        contractName: "MyContract",

        inputText: "",
        
        abiPlaceHolder: "[\n    {\n        \"inputs\": [\n            {\n                \"name\": \"name_\",\n                \"type\": \"string\"\n            },\n            {\n                \"name\": \"symbol_\",\n                \"type\": \"string\"\n            },\n            {\n                \"name\": \"initialSupply_\",\n                \"type\": \"uint256\"\n            }\n        ],\n        \"payable\": false,\n        \"stateMutability\": \"nonpayable\",\n        \"type\": \"constructor\"\n    }\n    ...\n]",

        wrapperName: "",

        outputText: "",
    },

    methods: {
        onUpdateInputCode: function () {
            if (this.contractName) {
                this.wrapperName = (this.contractName.replace(/\s\t/g, "_")) + "Wrapper"
            } else {
                this.wrapperName = "";
                this.outputText = "";
                return;
            }

            if (!this.inputText) {
                this.outputText = "";
                return;
            }

            var inputABI;

            try {
                inputABI = JSON.parse(this.inputText);
            } catch (ex) {
                this.outputText = "Invalid ABI";
                return;
            }
        },


    },

    mounted: function () {
        this.onUpdateInputCode();
    },
});
