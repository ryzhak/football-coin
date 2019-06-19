const PollSystem = artifacts.require("PollSystem");

module.exports = async function(deployer) {
  // deploy poll system
  const contract = await PollSystem.new();
  console.log('PollSystem address:', contract.address);
  // add 3 users
  await contract.addUser("0x6bf169c0c3f885d8a5a594c68b707ba56637ae95");
  await contract.addUser("0xc564f49ccb0838579dca903a5ec04d91b7518cd5");
  await contract.addUser("0x925839173e6535634dc7f72036efd04d4c7c3eb9");
};
