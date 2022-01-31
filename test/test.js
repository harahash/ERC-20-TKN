const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Progect testing", function () {
	let tknToken, owner, addr1, addr2;

	describe("Token contract", function () {
		let TKNToken;

		beforeEach(async function () {
			TKNToken = await ethers.getContractFactory("TKNToken");
			tknToken = await TKNToken.deploy();
			await tknToken.deployed();

			[owner, addr1, addr2] = await ethers.getSigners();
		});
		describe("Deployment", function () {
			it("Should set the right owner", async function () {
				expect(await tknToken.owner()).to.equal(owner.address);
			});

			it("Should assign the total supply of tokens to the owner", async function () {
				const ownerBalance = await tknToken.balanceOf(owner.address);
				expect(await tknToken.totalSupply()).to.equal(ownerBalance);
			});
		});

		describe("Transactions", function () {
			it("Should transfer tokens", async function () {
				await tknToken.transfer(
					addr1.address,
					ethers.utils.parseEther("1000")
				);
				expect(await tknToken.balanceOf(addr1.address)).to.equal(
					ethers.utils.parseEther("1000")
				);
			});

			it("Should give approval to send tokens", async function () {
				await tknToken.transfer(
					addr1.address,
					ethers.utils.parseEther("1000")
				);

				await tknToken
					.connect(addr1)
					.approve(owner.address, ethers.utils.parseEther("1000"));
				await tknToken.transferFrom(
					addr1.address,
					addr2.address,
					ethers.utils.parseEther("1000")
				);
				expect(await tknToken.balanceOf(addr2.address)).to.equal(
					ethers.utils.parseEther("1000")
				);
			});

			it("Should update balances after transaction", async function () {
				const initialOwnerBalance = await tknToken.balanceOf(
					owner.address
				);

				await tknToken.transfer(addr1.address, 100);
				await tknToken.transfer(addr2.address, 200);

				expect(await tknToken.balanceOf(owner.address)).to.equal(
					initialOwnerBalance.sub(300)
				);

				const addr1Balance = await tknToken.balanceOf(addr1.address);
				expect(addr1Balance).to.equal(100);

				const addr2Balance = await tknToken.balanceOf(addr2.address);
				expect(addr2Balance).to.equal(200);
			});
		});
	});

	describe("Staking contract", function () {
		let Staking, staking;

		beforeEach(async function () {
			Staking = await ethers.getContractFactory("Staking");
			staking = await Staking.deploy(tknToken.address);
			await staking.deployed();
		});

		describe("Deployment", function () {
			it("Should connect to the token contract", async function () {});
		});

		describe("Staking operations", function () {
			it("Should be able to take deposits", async function () {
				await tknToken.approve(
					staking.address,
					ethers.utils.parseEther("1000")
				);

				await staking.deposit(ethers.utils.parseEther("1000"));

				const totalDepositedAmount =
					await staking.totalDepositedAmount();
				expect(totalDepositedAmount).to.equal(
					ethers.utils.parseEther("1000")
				);
			});

			it("Should successfully distribute reward", async function () {
				await tknToken.transfer(
					addr1.address,
					ethers.utils.parseEther("1000")
				);
				await tknToken.transfer(
					addr2.address,
					ethers.utils.parseEther("1000")
				);

				await tknToken
					.connect(addr1)
					.approve(staking.address, ethers.utils.parseEther("1000"));
				await tknToken
					.connect(addr2)
					.approve(staking.address, ethers.utils.parseEther("1000"));

				await staking
					.connect(addr1)
					.deposit(ethers.utils.parseEther("1000"));
				await staking
					.connect(addr2)
					.deposit(ethers.utils.parseEther("1000"));

				const totalDepositedAmount =
					await staking.totalDepositedAmount();
				expect(totalDepositedAmount).to.equal(
					ethers.utils.parseEther("2000")
				);

				await staking.distribute(ethers.utils.parseEther("4000"));

				const totalStakedAmount = await staking.totalStakedAmount();
				expect(totalStakedAmount).to.equal(2);
			});

			it("Should successfully withdraw deposited tokens + reward", async function () {
				await tknToken.transfer(staking.address, 1000000);
				await tknToken.transfer(addr1.address, 400);
				await tknToken.transfer(addr2.address, 400);

				const addr1Balance = await tknToken.balanceOf(addr1.address);
				const addr2Balance = await tknToken.balanceOf(addr2.address);

				// expecting 500 & 600 because of unit "should update balances after transaction"
				expect(addr1Balance).to.equal(500);
				expect(addr2Balance).to.equal(600);

				await tknToken.connect(addr1).approve(staking.address, 500);
				await tknToken.connect(addr2).approve(staking.address, 600);

				await staking.connect(addr1).deposit(500);
				await staking.connect(addr2).deposit(600);

				const totalDepositedAmount =
					await staking.totalDepositedAmount();
				expect(totalDepositedAmount).to.equal(1100);

				await staking.distribute(3300);
				const totalStakedAmount = await staking.totalStakedAmount();
				expect(totalStakedAmount).to.equal(3);

				await staking.connect(addr1).withdrawAll();
				await staking.connect(addr2).withdrawAll();

				const addr1BalanceAfterStaking = await tknToken.balanceOf(
					addr1.address
				);
				const addr2BalanceAfterStaking = await tknToken.balanceOf(
					addr2.address
				);

				expect(addr1BalanceAfterStaking).to.equal(2000);
				expect(addr2BalanceAfterStaking).to.equal(2400);
				expect(await staking.totalDepositedAmount()).to.equal(0);
			});

			it("Should successfully unstake part of stake + reward", async function () {
				await tknToken.transfer(staking.address, 1000000);
				await tknToken.connect(addr1).approve(staking.address, 500);
				await staking.connect(addr1).deposit(500);
				await staking.distribute(1000);
				await staking.connect(addr1).partialWithdrawal(250);

				const balanceAfterPartialUnstake = await tknToken.balanceOf(
					addr1.address
				);
				const totalDepositedAmount =
					await staking.totalDepositedAmount();

				expect(balanceAfterPartialUnstake).to.equal(2250);
				expect(totalDepositedAmount).to.equal(250);
			});
		});
	});
});
