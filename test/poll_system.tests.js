require("chai").use(require("chai-as-promised")).should();

const { increaseTime } = require('./util/helpers');

const PollSystem = artifacts.require("PollSystem");

contract("PollSystem", (accounts) => {

	const ownerAddress = accounts[0];
	const userAddress = accounts[1];
	const otherAddress = accounts[2];

	let pollSystem;

	beforeEach(async() => {
		pollSystem = await PollSystem.new().should.be.fulfilled;
	});
	
	describe("addUser()", () => {
        it("should revert if user address is 0x00", async() => {
			const invalidUserAddress = 0x00;
			await pollSystem.addUser(invalidUserAddress, {from: ownerAddress}).should.be.rejected;
		});
		
		it("should add a new user", async() => {
			await pollSystem.addUser(userAddress, {from: ownerAddress}).should.be.fulfilled;
			assert.equal(await pollSystem.userActive(userAddress), true);
			assert.equal(await pollSystem.users(0), userAddress);
			assert.equal(await pollSystem.usersCount(), 1);
		});
	});

	describe("createPoll()", () => {
        it("should revert if consensus rate is 0", async() => {
			const availableUntil = (await web3.eth.getBlock("latest")).timestamp + 1;
			await pollSystem.createPoll(0, 1, availableUntil, "question", ["choice1", "choice2"], {from: ownerAddress}).should.be.rejected;
		});

		it("should revert if quorum rate is 0", async() => {
			const availableUntil = (await web3.eth.getBlock("latest")).timestamp + 1;
			await pollSystem.createPoll(1, 0, availableUntil, "question", ["choice1", "choice2"], {from: ownerAddress}).should.be.rejected;
		});

		it("should revert if finish date is less or equal than now", async() => {
			const availableUntil = (await web3.eth.getBlock("latest")).timestamp;
			await pollSystem.createPoll(1, 1, availableUntil, "question", ["choice1", "choice2"], {from: ownerAddress}).should.be.rejected;
		});

		it("should revert if question string is empty", async() => {
			const availableUntil = (await web3.eth.getBlock("latest")).timestamp + 1;
			await pollSystem.createPoll(1, 1, availableUntil, "", ["choice1", "choice2"], {from: ownerAddress}).should.be.rejected;
		});

		it("should revert if choices array is empty", async() => {
			const availableUntil = (await web3.eth.getBlock("latest")).timestamp + 1;
			await pollSystem.createPoll(1, 1, availableUntil, "question", [], {from: ownerAddress}).should.be.rejected;
		});

		it("should create a new poll", async() => {
			const availableUntil = (await web3.eth.getBlock("latest")).timestamp + 1;
			await pollSystem.createPoll(1, 2, availableUntil, "question", ["choice1", "choice2"], {from: ownerAddress}).should.be.fulfilled;
			// assert voting created
			const voting = await pollSystem.votings(0);
			assert.equal(voting.consensusRate, 1);
			assert.equal(voting.quorumRate, 2);
			assert.notEqual(voting.createdAt, 0);
			assert.equal(voting.availableUntil, availableUntil);
			assert.equal(voting.choicesCount, 2);
			assert.equal(voting.question, "question");
			// assert choices assigned
			const choices = await pollSystem.getChoicesFromVoting(0);
			assert.equal(choices[0], "choice1");
			assert.equal(choices[1], "choice2");
			// assert votings count
			assert.equal(await pollSystem.votingsCount(), 1);
		});
	});

	describe("getChoicesFromVoting()", () => {
        it("should revert if voting does not exist", async() => {
			await pollSystem.getChoicesFromVoting(0).should.be.rejected;
		});

		it("should return choices from voting", async() => {
			const availableUntil = (await web3.eth.getBlock("latest")).timestamp + 1;
			await pollSystem.createPoll(1, 1, availableUntil, "question", ["choice1", "choice2"], {from: ownerAddress}).should.be.fulfilled;
			const choices = await pollSystem.getChoicesFromVoting(0);
			assert.equal(choices[0], "choice1");
			assert.equal(choices[1], "choice2");
		});
	});

	describe("getVotesCount()", () => {
        it("should revert if voting does not exist", async() => {
			await pollSystem.getVotesCount(0).should.be.rejected;
		});

		it("should return votes count for each choice", async() => {
			// create poll
			const availableUntil = (await web3.eth.getBlock("latest")).timestamp + 24 * 60 * 60;
			await pollSystem.createPoll(1, 1, availableUntil, "question", ["choice1", "choice2"], {from: ownerAddress}).should.be.fulfilled;
			await pollSystem.addUser(userAddress, {from: ownerAddress}).should.be.fulfilled;
			// vote
			await pollSystem.vote(0, 0, {from: userAddress}).should.be.fulfilled;
			// assert
			const votingsCount = await pollSystem.getVotesCount(0);
			assert.equal(votingsCount[0], 1);
			assert.equal(votingsCount[1], 0);
		});
	});

	describe("isUserVoted()", () => {
        it("should revert if voting does not exist", async() => {
			await pollSystem.getVotesCount(0).should.be.rejected;
		});

		it("should revert if user address is 0x00", async() => {
			const availableUntil = (await web3.eth.getBlock("latest")).timestamp + 24 * 60 * 60;
			await pollSystem.createPoll(1, 1, availableUntil, "question", ["choice1", "choice2"], {from: ownerAddress}).should.be.fulfilled;
			await pollSystem.isUserVoted(0, 0x00).should.be.rejected;
		});

		it("should return true if user has voted", async() => {
			// create poll
			const availableUntil = (await web3.eth.getBlock("latest")).timestamp + 24 * 60 * 60;
			await pollSystem.createPoll(1, 1, availableUntil, "question", ["choice1", "choice2"], {from: ownerAddress}).should.be.fulfilled;
			await pollSystem.addUser(userAddress, {from: ownerAddress}).should.be.fulfilled;
			// vote
			await pollSystem.vote(0, 0, {from: userAddress}).should.be.fulfilled;
			// assert
			const isUserVoted = await pollSystem.isUserVoted(0, userAddress);
			assert.isTrue(isUserVoted);
		});

		it("should return false if user has not voted", async() => {
			// create poll
			const availableUntil = (await web3.eth.getBlock("latest")).timestamp + 24 * 60 * 60;
			await pollSystem.createPoll(1, 1, availableUntil, "question", ["choice1", "choice2"], {from: ownerAddress}).should.be.fulfilled;
			await pollSystem.addUser(userAddress, {from: ownerAddress}).should.be.fulfilled;
			// vote
			await pollSystem.vote(0, 0, {from: userAddress}).should.be.fulfilled;
			// assert
			const isUserVoted = await pollSystem.isUserVoted(0, otherAddress);
			assert.isFalse(isUserVoted);
		});
	});
	
	describe("removeUser()", () => {
        it("should revert if user address is 0x00", async() => {
			const invalidUserAddress = 0x00;
			await pollSystem.removeUser(invalidUserAddress, {from: ownerAddress}).should.be.rejected;
		});

		it("should remove a user", async() => {
			// add user
			await pollSystem.addUser(userAddress, {from: ownerAddress}).should.be.fulfilled;
			assert.equal(await pollSystem.userActive(userAddress), true);
			assert.equal(await pollSystem.users(0), userAddress);
			assert.equal(await pollSystem.usersCount(), 1);
			// remove user
			await pollSystem.removeUser(userAddress, {from: ownerAddress}).should.be.fulfilled;
			assert.equal(await pollSystem.userActive(userAddress), false);
			assert.equal(await pollSystem.users(0), 0x00);
			assert.equal(await pollSystem.usersCount(), 0);
		});
	});
	
	describe("vote()", () => {
        it("should revert if voting does not exist", async() => {
			await pollSystem.addUser(userAddress, {from: ownerAddress}).should.be.fulfilled;
			await pollSystem.vote(0, 0, {from: userAddress}).should.be.rejected;
		});

		it("should revert if choice does not exist", async() => {
			// create poll
			const availableUntil = (await web3.eth.getBlock("latest")).timestamp + 24 * 60 * 60;
			await pollSystem.createPoll(1, 1, availableUntil, "question", ["choice1", "choice2"], {from: ownerAddress}).should.be.fulfilled;
			await pollSystem.addUser(userAddress, {from: ownerAddress}).should.be.fulfilled;
			// vote
			await pollSystem.vote(0, 2, {from: userAddress}).should.be.rejected;
		});

		it("should revert if voting has already finished", async() => {
			// create poll
			const availableUntil = (await web3.eth.getBlock("latest")).timestamp + 24 * 60 * 60;
			await pollSystem.createPoll(1, 1, availableUntil, "question", ["choice1", "choice2"], {from: ownerAddress}).should.be.fulfilled;
			await pollSystem.addUser(userAddress, {from: ownerAddress}).should.be.fulfilled;
			// add 1 day
			await increaseTime(24 * 60 * 60);
			// vote
			await pollSystem.vote(0, 0, {from: userAddress}).should.be.rejected;
		});

		it("should revert if user has already voted", async() => {
			// create poll
			const availableUntil = (await web3.eth.getBlock("latest")).timestamp + 24 * 60 * 60;
			await pollSystem.createPoll(1, 1, availableUntil, "question", ["choice1", "choice2"], {from: ownerAddress}).should.be.fulfilled;
			await pollSystem.addUser(userAddress, {from: ownerAddress}).should.be.fulfilled;
			// vote
			await pollSystem.vote(0, 0, {from: userAddress}).should.be.fulfilled;
			await pollSystem.vote(0, 0, {from: userAddress}).should.be.rejected;
		});

		it("should increase votes count and mark user as voted", async() => {
			// create poll
			const availableUntil = (await web3.eth.getBlock("latest")).timestamp + 24 * 60 * 60;
			await pollSystem.createPoll(1, 1, availableUntil, "question", ["choice1", "choice2"], {from: ownerAddress}).should.be.fulfilled;
			await pollSystem.addUser(userAddress, {from: ownerAddress}).should.be.fulfilled;
			// vote
			await pollSystem.vote(0, 0, {from: userAddress}).should.be.fulfilled;
			// assert
			const votingsCount = await pollSystem.getVotesCount(0);
			assert.equal(votingsCount[0], 1);
			assert.equal(votingsCount[1], 0);
			assert.equal(await pollSystem.isUserVoted(0, userAddress), true);
		});
	});

});
