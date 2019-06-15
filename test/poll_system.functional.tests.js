require('chai').use(require('chai-as-promised')).should();

const PollSystem = artifacts.require("PollSystem");

contract("PollSystem: Functional", (accounts) => {

	const ownerAddress = accounts[0];
	const userAddress = accounts[1];

	let pollSystem;

	beforeEach(async() => {
		pollSystem = await PollSystem.new().should.be.fulfilled;
	});

	describe("onlyUser()", () => {
        it("should revert if method is called not by user", async() => {
			// create poll
			const availableUntil = (await web3.eth.getBlock("latest")).timestamp + 24 * 60 * 60;
			await pollSystem.createPoll(1, 1, availableUntil, "question", ["choice1", "choice2"], {from: ownerAddress}).should.be.fulfilled;
			await pollSystem.addUser(userAddress, {from: ownerAddress}).should.be.fulfilled;
			// vote
			await pollSystem.vote(0, 0, {from: ownerAddress}).should.be.rejected;
		});
		
		it("should execute method that can be called only by user", async() => {
			// create poll
			const availableUntil = (await web3.eth.getBlock("latest")).timestamp + 24 * 60 * 60;
			await pollSystem.createPoll(1, 1, availableUntil, "question", ["choice1", "choice2"], {from: ownerAddress}).should.be.fulfilled;
			await pollSystem.addUser(userAddress, {from: ownerAddress}).should.be.fulfilled;
			// vote
			await pollSystem.vote(0, 0, {from: userAddress}).should.be.fulfilled;
		});
	});

});
