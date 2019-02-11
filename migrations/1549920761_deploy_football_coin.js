const MyFootballCoin = artifacts.require("MyFootballCoin");

module.exports = function(deployer) {
	// Use deployer to state migration tasks.
	deployer.deploy(MyFootballCoin);
};
