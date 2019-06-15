pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract PollSystem is Ownable {

	using SafeMath for uint;

	mapping(address => bool) userActive;
	address[] public users;

	mapping(uint => Voting) public votings;
	uint public votingsCount;

	struct Voting {
		uint consensusRate;
		uint quorumRate;
		uint createdAt;
		uint availableUntil;
		uint choicesCount;
		string question;
		string[] choices;
		mapping(address => bool) voted;
		mapping(uint => uint) choiceVotesCount;
	}

	constructor() public {}

	//**********
	// Modifiers
	//**********

	/**
	 * @dev Modifier checks that action can be called only by user
	 */
	modifier onlyUser() {
		require(userActive[msg.sender], "only user can perform this action");
		_;
	}

	//**************
	// Owner methods
	//**************

	/**
	 * @dev Adds a new user that can vote
	 * @param _userAddress user address
	 */
	function addUser(address _userAddress) external onlyOwner {
		require(_userAddress != address(0), "user address can not be 0x00");
		userActive[_userAddress] = true;
		users.push(_userAddress);
	}

	/**
	 * @dev Creates a new poll
	 * @param _consensusRate consensus rate, min rate of voters with acceptable decision to approve proposal, 10000 = 100%
	 * @param _quorumRate quorum rate, min rate of voters for proposal to be active, 10000 = 100%
	 * @param _availableUntil available until timestamp, until this date users can vote
	 * @param _question proposal text
	 * @param _choices proposal choices
	 */
	function createPoll(uint _consensusRate, uint _quorumRate, uint _availableUntil, string calldata _question, string[] calldata _choices) external onlyOwner {
		// validation
		require(_consensusRate > 0, "consensus rate can not be 0");
		require(_quorumRate > 0, "quorum rate can not be 0");
		require(_availableUntil > now, "voting finish date should be greater than now");
		require(bytes(_question).length > 0, "question can not be empty");
		require(_choices.length > 0, "choices can not be empty");
		// create and save a new poll
		Voting memory voting;
		voting.consensusRate = _consensusRate;
		voting.quorumRate = _quorumRate;
		voting.createdAt = now;
		voting.availableUntil = _availableUntil;
		voting.choicesCount = _choices.length;
		voting.question = _question;
		votings[votingsCount] = voting;
		// assign choices to voting
		for(uint i = 0; i < _choices.length; i++) {
			votings[votingsCount].choices.push(_choices[i]);
		}
		// update global votings count
		votingsCount = votingsCount.add(1);
	}

	/**
     * @dev Removes user that can vote
     * @param _userAddress user address to be deleted
     */
    function removeUser(address _userAddress) external onlyOwner {
        require(_userAddress != address(0), "user address can not be 0x00");
        // disable user and remove his address
        userActive[_userAddress] = false;
        for(uint i = 0; i < users.length; i++) {
            if(users[i] == _userAddress) {
                delete users[i];
                break;
            }
        }
    }

	//*************
	// User methods
	//*************

	/**
	 * @dev Votes for a choice
	 * @param _votingIndex voting index
	 * @param _choiceIndex choice index
	 */
	function vote(uint _votingIndex, uint _choiceIndex) external onlyUser {
		// validation
		require(_votingIndex < votingsCount, "voting does not exist");
		require(_choiceIndex < votings[_votingIndex].choicesCount, "choice does not exist");
		require(now < votings[_votingIndex].availableUntil, "voting is over");
		require(!votings[_votingIndex].voted[msg.sender], "user already voted");
		// increase choice by 1
		votings[_votingIndex].choiceVotesCount[_choiceIndex] = votings[_votingIndex].choiceVotesCount[_choiceIndex].add(1);
		// set user as voted
		votings[_votingIndex].voted[msg.sender] = true;
	}

}
