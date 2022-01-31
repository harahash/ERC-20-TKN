const hre = require("hardhat");

async function main() {
	const TKNToken = await hre.ethers.getContractFactory("TKNToken");
	const tknToken = await TKNToken.deploy();

	await tknToken.deployed();

	console.log("Token contract deployed to:", tknToken.address);

	const Staking = await hre.ethers.getContractFactory("Staking");
	const staking = await Staking.deploy(tknToken.address);

	await staking.deployed();

	console.log("Staking contract deployed to: ", staking.address);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
