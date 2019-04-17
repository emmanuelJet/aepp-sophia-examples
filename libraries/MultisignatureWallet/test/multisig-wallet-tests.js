const fs = require('fs');
const path = require('path');
const chai = require('chai');
let chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const assert = chai.assert;
const AeSDK = require('@aeternity/aepp-sdk');
const Universal = AeSDK.Universal;
const config = require('./constants/config.json')
const errorMessages = require('./constants/error-messages.json');

const MULTISIGNATURE_WALLET_CONTRACT_PATH =  "./../contracts/MultisigWallet.aes";
const VOTING_CONTRACT_PATH = './../contracts/Voting-test.aes';
// const contentOfMultisigContract = utils.readFileRelative(path.resolve(__dirname, MULTISIGNATURE_WALLET_CONTRACT_PATH), config.filesEncoding);
// const contentOfVotingContract = utils.readFileRelative(path.resolve(__dirname, VOTING_CONTRACT_PATH), config.filesEncoding);

const libHelper = require('../utils/library-resolver');
const contentOfMultisigContract =  libHelper.resolveLibraries(path.resolve(__dirname, MULTISIGNATURE_WALLET_CONTRACT_PATH));
const contentOfVotingContract =  libHelper.resolveLibraries(path.resolve(__dirname, VOTING_CONTRACT_PATH));

const utils = require('./../utils/utils');
// const getDeployedContractInstance = utils.getDeployedContractInstance;
// const executeSmartContractFunction = utils.executeSmartContractFunction;
// const executeSmartContractFunctionFromAnotherClient = utils.executeSmartContractFunctionFromAnotherClient;
const getClient = utils.getClient;
// const publicKeyToHex = utils.publicKeyToHex;

const RANDOM_ADDRESS_1 = 'ak_gLYH5tAexTCvvQA6NpXksrkPJKCkLnB9MTDFTVCBuHNDJ3uZv';
const RANDOM_ADDRESS_2 = 'ak_zPoY7cSHy2wBKFsdWJGXM7LnSjVt6cn1TWBDdRBUMC7Tur2NQ';
const RANDOM_ADDRESS_3 = 'ak_tWZrf8ehmY7CyB1JAoBmWJEeThwWnDpU4NadUdzxVSbzDgKjP';

// const rndAddrAsHex1 = '' // publicKeyToHex(RANDOM_ADDRESS_1);
// const rndAddrAsHex2 = '' // publicKeyToHex(RANDOM_ADDRESS_2);
// const rndAddrAsHex3 = '' // publicKeyToHex(RANDOM_ADDRESS_3);

let VALID_METHOD_NAME = 'Vote';
let INVALID_METHOD_NAME = 'sayHello';

const ownerPublicKeyAsHex = '' // utils.publicKeyToHex(config.ownerKeyPair.publicKey);
const notOwnerPublicKeyAsHex = '' // utils.publicKeyToHex(config.notOwnerKeyPair.publicKey);

const ownerPublicKey = config.ownerKeyPair.publicKey;
const notOwnerPublicKey = config.notOwnerKeyPair.publicKey;

const multiSigFunctions = require('./constants/smartContractFunctions.json');
const votingFunctions = require('./constants/helperSmartContractFunctions.json');

async function getVotingContractInstance () {
	let notOwnerConfig = JSON.parse(JSON.stringify(config));
	notOwnerConfig.ownerKeyPair = config.notOwnerKeyPair;
	
	// const readContract = fs.readFileSync(path.resolve(__dirname, VOTING_CONTRACT_PATH), 'utf8');
	// let votingContractInfo = await getDeployedContractInstance(Universal, notOwnerConfig, readContract);
	// return votingContractInfo.deployedContract;
	
	const client = await getClient(Universal, notOwnerConfig, config.ownerKeyPair);;
	const contractInstance = await client.getContractInstance(contentOfVotingContract);
	await contractInstance.deploy([]);
	console.log(contractInstance);
	
	return contractInstance;
}

describe('MultiSig', () => {

	describe('Deploy contract', () => {

		let firstClient;
		let multiSigInstance;
		let deployInfo;

		before(async () => {
			// let deployInfo = await getDeployedContractInstance(Universal, config, contentOfMultisigContract);
			// multiSigInstance = deployInfo.deployedContract;
			
			firstClient = await getClient(Universal, config, config.ownerKeyPair);
		})

		// DO NOT CHANGE TEST POSITIONS
		it.only('deploying successfully', async () => {
			multiSigInstance = await firstClient.getContractInstance(contentOfMultisigContract);
            deployInfo = (await multiSigInstance.deploy([])).deployInfo;

			console.log('deployInfo');
			console.log(deployInfo);
			console.log();

			assert.equal(ownerPublicKey, deployInfo.owner)
		});

		xit(`[NEGATIVE] Should not init owner.`, async () => {
			//let addrAsHex = publicKeyToHex(multiSigInstance.address);
			//await assert.isRejected(executeSmartContractFunction(multiSigInstance, multiSigFunctions.INIT_OWNER, `(${addrAsHex})`), errorMessages.CANNOT_BE_SAME_ADDRESS);
			await assert.isRejected(multiSigInstance.call(multiSigFunctions.INIT_OWNER, [ deployInfo.address ]), errorMessages.CANNOT_BE_SAME_ADDRESS);
		});

		it.only(`Should init owner correct.`, async () => {

			// let funcResult = await executeSmartContractFunction(multiSigInstance, multiSigFunctions.INIT_OWNER, `(${notOwnerPublicKeyAsHex})`);
			// let resultValue = (await funcResult.decode('()')).value;
			
			// assert.ok(Array.isArray(resultValue) && resultValue.length === 0, 'Expected output does not match!');

			//await multiSigInstance.call(multiSigFunctions.INIT_OWNER, [ notOwnerPublicKey ]);
			let a = await multiSigInstance.call('get');
			console.log(a);
			console.log(await a.decode('string', { abi: 'sophia'}));
		});

		it('[NEGATIVE] Should configure correct, if it is configured correct, initOwner should throw exception.', async () => {

			let funcResult = await multiSigInstance.call(multiSigFunctions.CONFIGURE);
			let resultValue = await funcResult.decode('()');
			assert.ok(Array.isArray(resultValue) && resultValue.length === 0, 'Expected output does not match!');
			
			await assert.isRejected(multiSigInstance.call(multiSigFunctions.INIT_OWNER, [ownerPublicKeyAsHex]), errorMessages.NOT_CONFIGURED);
		});
	});
	
	describe('Contract is not configured', function () {
		let firstClient = await getClient(Universal, config, config.ownerKeyPair);
		let multiSigInstance;

		// let deployedContractInstance;
		// let deployInfo;
		before(async () => {
			// deployInfo = await getDeployedContractInstance(Universal, config, contentOfMultisigContract);
			// deployedContractInstance = deployInfo.deployedContract;

			multiSigInstance = await firstClient.getContractInstance(contentOfMultisigContract);
            deployInfo = (await multiSigInstance.deploy([])).deployInfo;
		});

		it('[NEGATIVE] NOT Configured, should NOT get confirmations', async () => {
			await assert.isRejected(multiSigInstance.call(multiSigFunctions.GET_CONFIRMATIONS, [0]), errorMessages.ONLY_CONFIGURED);
		});

		it('[NEGATIVE] NOT Configured, should NOT approve', async () => {
			let votingContractInstance = await getVotingContractInstance();!!!
			// let addrAsHex = publicKeyToHex(votingContractInstance.address);
			await assert.isRejected(multiSigInstance.call(multiSigFunctions.APPROVE, [
				0,
				votingContractInstance.address
			]), errorMessages.ONLY_CONFIGURED);
		});

		it('[NEGATIVE] NOT Configured, should NOT add tx', async () => {
			await assert.isRejected(multiSigInstance.call(multiSigFunctions.ADD_TRANSACTION, [VALID_METHOD_NAME]), errorMessages.ONLY_CONFIGURED);
		});

		it('[NEGATIVE] NOT Configured, should NOT vote to remove owner', async () => {
			await assert.isRejected(multiSigInstance.call(multiSigFunctions.VOTE_REMOVE_OWNER, [
				RANDOM_ADDRESS_1
			]), errorMessages.ONLY_CONFIGURED);
		});

		it('[NEGATIVE] NOT Configured, should NOT vote to add owner', async () => {
			await assert.isRejected(multiSigInstance.call(multiSigFunctions.VOTE_ADD_OWNER, [
				RANDOM_ADDRESS_1
			]), errorMessages.ONLY_CONFIGURED);
		});
	})

	describe('Contract is configured', function () {
		// let deployedContractInstance;
		// let anotherClientConfiguration;

		let firstClient = await getClient(Universal, config, config.ownerKeyPair);
		let secondClient = await getClient(Universal, config, config.notOwnerKeyPair);

		let multiSigInstance;
		let multiSigInstanceNotOwner;

		beforeEach(async () => {
			// const deployInfo = await getDeployedContractInstance(Universal, config, contentOfMultisigContract);
			// deployedContractInstance = deployInfo.deployedContract;

			// // create second/another client configuration
			// let anotherClient = await getAEClient(Universal, config, config.notOwnerKeyPair);

			// anotherClientConfiguration = {
			// 	client: anotherClient,
			// 	byteCode: deployInfo.compiledContract.bytecode,
			// 	contractAddress: deployedContractInstance.address
			// }

			// await executeSmartContractFunction(deployedContractInstance, multiSigFunctions.INIT_OWNER, `(${ownerPublicKeyAsHex})`);
			// await executeSmartContractFunction(deployedContractInstance, 'configure');

			multiSigInstance = await firstClient.getContractInstance(contentOfMultisigContract);
			await multiSigInstance.deploy([])
			
			await multiSigInstance.call(multiSigFunctions.INIT_OWNER, [
				ownerPublicKey
			]);

			multiSigInstanceNotOwner = await secondClient.getContractInstance(contentOfMultisigContract, {
				contractAddress: multiSigInstance.deployInfo.address
			}); 
		})

		describe('Vote, add and remove owners', function () {
			it('should vote to add new owner correctly', async () => {
				await assert.isFulfilled(executeSmultiSigInstance.callmartContractFunction(multiSigFunctions.VOTE_ADD_OWNER, [
					RANDOM_ADDRESS_2
				]));
			});
	
			it('[NEGATIVE] Not owner should NOT vote to add new owner.', async () => {
				await assert.isRejected(multiSigInstanceNotOwner.call(multiSigFunctions.VOTE_ADD_OWNER, [
					RANDOM_ADDRESS_2
				]), errorMessages.ONLY_OWNERS);
			});
	
			it('[NEGATIVE] should NOT vote twice to add already existent owner', async () => {
				await multiSigInstance.call(multiSigFunctions.VOTE_ADD_OWNER, [
					RANDOM_ADDRESS_2
				]);
				
				await assert.isRejected(multiSigInstance.call(multiSigFunctions.VOTE_ADD_OWNER, [
					RANDOM_ADDRESS_2
				]), errorMessages.ALREADY_OWNER);
			});
	
			it('should vote to remove an owner correctly', async () => {
				await multiSigInstance.call(multiSigFunctions.VOTE_ADD_OWNER, [
					RANDOM_ADDRESS_2
				]);
				
				await assert.isFulfilled(multiSigInstance.call(multiSigFunctions.VOTE_REMOVE_OWNER, [
					RANDOM_ADDRESS_2
				]));
			});
	
			it('[NEGATIVE] should NOT vote to remove a nonexistent owner', async () => {
				await assert.isRejected(multiSigInstance.call(multiSigFunctions.VOTE_REMOVE_OWNER, [
					RANDOM_ADDRESS_2
				]), errorMessages.PASSED_ADDRESS_IS_NOT_OWNER);
			});
	
			it('[NEGATIVE] NOT owner should NOT vote to remove an owner.', async () => {
				await multiSigInstance.call(multiSigFunctions.VOTE_ADD_OWNER, [
					RANDOM_ADDRESS_2
				]);
				
				await assert.isRejected(multiSigInstanceNotOwner.call(multiSigFunctions.VOTE_REMOVE_OWNER, [
					RANDOM_ADDRESS_2
				]), errorMessages.ONLY_OWNERS);
			});

			it('should remove an owner correctly', async () => {
				await multiSigInstance.call(multiSigFunctions.VOTE_ADD_OWNER, [
					RANDOM_ADDRESS_3
				]);
				await assert.isFulfilled(multiSigInstance.call(multiSigFunctions.VOTE_REMOVE_OWNER, [
					RANDOM_ADDRESS_3
				]));
			});
	
			it('[NEGATIVE] should NOT remove nonexistent owner, owner to remove is voted correctly', async () => {
				await multiSigInstance.call(multiSigFunctions.VOTE_ADD_OWNER, [
					RANDOM_ADDRESS_2
				]);
				
				await assert.isRejected(multiSigInstance.call(multiSigFunctions.VOTE_REMOVE_OWNER, [
					RANDOM_ADDRESS_1
				]), errorMessages.NOT_AN_OWNER);
			});
		})

		describe('Transaction functionality', function () {

			it('should add transaction correct', async () => {
				await assert.isFulfilled(multiSigInstance.call(multiSigFunctions.ADD_TRANSACTION, [
					VALID_METHOD_NAME
				]));
			});

			it('[NEGATIVE] should NOT add transaction, invalid method name', async () => {
				await assert.isRejected(multiSigInstance.call(multiSigFunctions.ADD_TRANSACTION, [
					INVALID_METHOD_NAME
				]), errorMessages.INVALID_METHOD_NAME);
			});

			it('should add multiple transactions and increment tx id correct', async () => {
				let txId = 0;
				let funcResult = await multiSigInstance.call(multiSigFunctions.ADD_TRANSACTION, [
					VALID_METHOD_NAME
				]);
				let resultValue = await funcResult.decode('int');
				assert.ok(resultValue === txId++, "Tx id is not correct");

				funcResult = await multiSigInstance.call(multiSigFunctions.ADD_TRANSACTION, [
					VALID_METHOD_NAME
				]);
				resultValue = await funcResult.decode('int');
				assert.ok(resultValue === txId++, "Tx id is not correct");

				funcResult = await multiSigInstance.call(multiSigFunctions.ADD_TRANSACTION, [
					VALID_METHOD_NAME
				]);
				resultValue = await funcResult.decode('int');
				assert.ok(resultValue === txId++, "Tx id is not correct");

				funcResult = await multiSigInstance.call(multiSigFunctions.ADD_TRANSACTION, [
					VALID_METHOD_NAME
				]);
				resultValue = await funcResult.decode('int');
				assert.ok(resultValue === txId++, "Tx id is not correct");
			});

			it('[NEGATIVE] NOT owner should NOT add transaction', async () => {
				await assert.isRejected(multiSigInstanceNotOwner.call(multiSigFunctions.ADD_TRANSACTION, [
					VALID_METHOD_NAME
				]), errorMessages.ONLY_OWNERS);
			});

			it('Added transaction should have 0 confirmations', async () => {
				await multiSigInstance.call(multiSigFunctions.ADD_TRANSACTION, [
					VALID_METHOD_NAME
				]);
				let funcResult = await multiSigInstance.call(multiSigFunctions.GET_CONFIRMATIONS, [
					0
				]);
				let resultValue = await funcResult.decode('int');
				assert.ok(resultValue === 0, "Transaction have confirmations");
			});

			it('Add 2 transaction and approve second one', async () => {
				await multiSigInstance.call(multiSigFunctions.VOTE_ADD_OWNER, [
					RANDOM_ADDRESS_3
				]); // vote for new owner 
				await multiSigInstance.call(multiSigFunctions.VOTE_CHANGE_REQUIREMENT, [
					2,
					true
				]); // increase required

				await multiSigInstance.call(multiSigFunctions.ADD_TRANSACTION, [
					VALID_METHOD_NAME
				]);
				await multiSigInstance.call(multiSigFunctions.ADD_TRANSACTION, [
					VALID_METHOD_NAME
				]);

				let votingContractInstance = await getVotingContractInstance();
				// let addrAsHex = publicKeyToHex(votingContractInstance.address);

				await multiSigInstance.call(multiSigFunctions.APPROVE, [
					1,
					votingContractInstance.deployInfo.address
				]);
				let funcResult = await multiSigInstance.call(multiSigFunctions.GET_CONFIRMATIONS, [
					0
				]);
				let resultValue = await funcResult.decode('int');
				assert.ok(resultValue === 0, "Transaction have confirmations");

				funcResult = await multiSigInstance.call(multiSigFunctions.GET_CONFIRMATIONS, [
					1
				]);
				resultValue = await funcResult.decode('int');
				assert.ok(resultValue === 1, "Transaction have confirmations");
			});

			it('Add 2 transaction and approve both', async () => {

				await multiSigInstance.call(multiSigFunctions.VOTE_ADD_OWNER, [
					RANDOM_ADDRESS_3
				]); // vote for new owner 
				await multiSigInstance.call(multiSigFunctions.VOTE_CHANGE_REQUIREMENT, [
					2,
					true
				]); // increase required

				await multiSigInstance.call(multiSigFunctions.ADD_TRANSACTION, [
					VALID_METHOD_NAME
				]);
				await multiSigInstance.call(multiSigFunctions.ADD_TRANSACTION, [
					VALID_METHOD_NAME
				]);

				let votingContractInstance = await getVotingContractInstance();
				//let addrAsHex = publicKeyToHex(votingContractInstance.address);

				await multiSigInstance.call(multiSigFunctions.APPROVE, [
					0,
					votingContractInstance.deployInfo.address
				]);
				await multiSigInstance.call(multiSigFunctions.APPROVE, [
					1,
					votingContractInstance.deployInfo.address
				]);
				let funcResult = await multiSigInstance.call(multiSigFunctions.GET_CONFIRMATIONS, [
					0
				]);
				let resultValue = await funcResult.decode('int');
				assert.ok(resultValue === 1, "Transaction have confirmations");

				funcResult = await multiSigInstance.call(multiSigFunctions.GET_CONFIRMATIONS, [
					1
				]);
				resultValue = await funcResult.decode('int');
				assert.ok(resultValue === 1, "Transaction have confirmations");
			});

			it('Add 2 transaction and approve both, first one with 2 approves, second with 1', async () => {

				await multiSigInstance.call(multiSigFunctions.VOTE_ADD_OWNER, [
					RANDOM_ADDRESS_3 
				]);
				await multiSigInstance.call(multiSigFunctions.VOTE_ADD_OWNER, [
					RANDOM_ADDRESS_2
				]);

				await multiSigInstance.call(multiSigFunctions.VOTE_CHANGE_REQUIREMENT, [
					2,
					true
				]); // increase required
				await multiSigInstance.call(multiSigFunctions.VOTE_CHANGE_REQUIREMENT, [
					3,
					true
				]); // increase required
				await multiSigInstanceNotOwner.call(multiSigFunctions.VOTE_CHANGE_REQUIREMENT, [
					3,
					true
				]); // increase required
				
				await multiSigInstance.call(multiSigFunctions.ADD_TRANSACTION, [
					VALID_METHOD_NAME
				]);
				await multiSigInstance.call(multiSigFunctions.ADD_TRANSACTION, [
					VALID_METHOD_NAME
				]);

				let votingContractInstance = await getVotingContractInstance();
				//let addrAsHex = publicKeyToHex(votingContractInstance.address);

				await multiSigInstance.call(multiSigFunctions.APPROVE, [
					0,
					votingContractInstance.deployInfo.address
				]);
				await multiSigInstance.call(multiSigFunctions.APPROVE, [
					1,
					votingContractInstance.deployInfo.address
				]);
				
				await multiSigInstanceNotOwner.call(multiSigFunctions.APPROVE, [
					0,
					votingContractInstance.deployInfo.address
				]);
				
				let funcResult = await multiSigInstance.call(multiSigFunctions.GET_CONFIRMATIONS, [
					0
				]);
				let resultValue = await funcResult.decode('int');
				assert.ok(resultValue === 2, "Transaction have confirmations");
				
				funcResult = await multiSigInstance.call(multiSigFunctions.GET_CONFIRMATIONS, [
					1
				]);
				resultValue = await funcResult.decode('int');
				assert.ok(resultValue === 1, "Transaction have confirmations");
			});

			it('Execute approved transaction', async () => {
				let votingContractInstance = await getVotingContractInstance();
				//let addrAsHex = publicKeyToHex(votingContractInstance.address);
				
				let funcResult = await votingContractInstance.call(votingFunctions.RESULT);
				let resultValue = await funcResult.decode('int').value;
				assert.ok(resultValue === 0, "Voting contract state is incorrect!");
				
				await multiSigInstance.call(multiSigFunctions.ADD_TRANSACTION, [
					VALID_METHOD_NAME
				]);
				await assert.isFulfilled(multiSigInstance.call(multiSigFunctions.APPROVE, [
					0,
					votingContractInstance.deployInfo.address
				]));

				funcResult = await votingContractInstance.call(votingFunctions.RESULT);
				resultValue = await funcResult.decode('int');
				assert.ok(resultValue === 1, "Transaction have confirmations");
			});

			it('[NEGATIVE] NOT owner should NOT approve transaction', async () => {
			
				let notOwnerConfig = JSON.parse(JSON.stringify(config));
				notOwnerConfig.ownerKeyPair = config.notOwnerKeyPair;

				// let votingContractInfo = await getDeployedContractInstance(Universal, notOwnerConfig, contentOfVotingContract);
				// let votingContractInstance = votingContractInfo.deployedContract;
				// let addrAsHex = publicKeyToHex(votingContractInstance.address);

				const votingContractInstance = await getVotingContractInstance();

				await multiSigInstance.call(multiSigFunctions.ADD_TRANSACTION, [
					VALID_METHOD_NAME
				]);
				
				await assert.isRejected(multiSigInstanceNotOwner.call(multiSigFunctions.APPROVE, [
					0,
					votingContractInstance.deployInfo.address
				]), errorMessages.ONLY_OWNERS);
			});
		})

		describe('Required validation', async function () {

			it('[NEGATIVE] should NOT set "required" bigger than owners count', async () => {
				await assert.isRejected(multiSigInstance.call(multiSigFunctions.VOTE_CHANGE_REQUIREMENT, [
					2,
					true
				]), errorMessages.INVALID_REQUIREMENTS);
			});

			it('[NEGATIVE] should NOT set "required" to 0', async () => {
				await multiSigInstance.call(multiSigFunctions.VOTE_ADD_OWNER, [
					RANDOM_ADDRESS_2
				]);
				await assert.isRejected(multiSigInstance.call(multiSigFunctions.VOTE_CHANGE_REQUIREMENT, [
					0,
					true
				]), errorMessages.INVALID_REQUIREMENTS);
			});

			it('[NEGATIVE] should NOT add new owner with less votes', async () => {
				await multiSigInstance.call(multiSigFunctions.VOTE_ADD_OWNER, [
					RANDOM_ADDRESS_2
				]); // add new owner
				await multiSigInstance.call(multiSigFunctions.VOTE_CHANGE_REQUIREMENT, [
					2, 
					true
				]); // increase required
				await multiSigInstance.call(multiSigFunctions.VOTE_ADD_OWNER, [
					RANDOM_ADDRESS_3
				]); // vote for new owner 

				// not owner should not vote, RANDOM_ADDRESS_3 is still not owner
				await assert.isRejected(multiSigInstanceNotOwner.call(multiSigFunctions.VOTE_ADD_OWNER, [
					RANDOM_ADDRESS_1
				]), errorMessages.ONLY_OWNERS);
			});

			it('[NEGATIVE] Should NOT add new owner twice', async () => {
				await multiSigInstance.call(multiSigFunctions.VOTE_ADD_OWNER, [
					RANDOM_ADDRESS_3
				]);
				await multiSigInstance.call(multiSigFunctions.VOTE_ADD_OWNER, [
					RANDOM_ADDRESS_2
				]);
				await assert.isRejected(multiSigInstanceNotOwner.call(multiSigFunctions.VOTE_ADD_OWNER, [
					RANDOM_ADDRESS_2
				]), errorMessages.ALREADY_OWNER);
			});

			it('Should NOT remove owner without needed votes', async () => {
				await multiSigInstance.call(multiSigFunctions.VOTE_ADD_OWNER, [
					RANDOM_ADDRESS_3
				]);
				await multiSigInstance.call(multiSigFunctions.VOTE_CHANGE_REQUIREMENT, [
					2,
					true
				]);

				await multiSigInstance.call(multiSigFunctions.VOTE_REMOVE_OWNER, [
					RANDOM_ADDRESS_3
				]);
				await assert.isFulfilled(multiSigInstanceNotOwner.call(multiSigFunctions.VOTE_CHANGE_REQUIREMENT, [
					2,
					true
				]))
			});

			it('[NEGATIVE] Should NOT remove owner twice', async () => {
				await multiSigInstance.call(multiSigFunctions.VOTE_ADD_OWNER, [
					RANDOM_ADDRESS_3
				]);
				
				await multiSigInstance.call(multiSigFunctions.VOTE_REMOVE_OWNER, [
					RANDOM_ADDRESS_3
				]);
				await assert.isRejected(multiSigInstance.call(multiSigFunctions.VOTE_REMOVE_OWNER, [
					RANDOM_ADDRESS_3
				]), errorMessages.NOT_AN_OWNER);
			});
		})
	})	
})