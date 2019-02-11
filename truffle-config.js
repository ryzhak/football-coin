const HDWalletProvider = require('truffle-hdwallet-provider');

const env = require("./env.js");

module.exports = {
	networks: {
		kovan: {
			provider: () => new HDWalletProvider(env.MNEMONIC, `https://kovan.infura.io/v3/${env.INFURA_API_KEY}`),
			network_id: 42,
			gas: 8000000
		}
	}
}
