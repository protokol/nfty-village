import { Signer } from "ethers";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { NftyHalloween, NftyHalloween__factory } from "../typechain";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    let accounts: Signer[];
    let nftTokenContract: NftyHalloween;

    accounts = await hre.ethers.getSigners();

    console.log(await accounts[0].getAddress());

    const tokenFactory = (await hre.ethers.getContractFactory(
        "NftyHalloween",
        accounts[0]
    )) as NftyHalloween__factory;

    nftTokenContract = await tokenFactory.deploy(
        process.env.NFTY_HALLOWEEN_BASE_URL || "www.placeholder.com/",
        process.env.NFTY_HALLOWEEN_PASS_ADDRESS ||
            "0xBB21DE52AF8d8db738D967C688CEB90FBdAa30C3"
    );

    console.log(
        `The address the Contract WILL have once mined: ${nftTokenContract.address}`
    );

    console.log(
        `The transaction that was sent to the network to deploy the Contract: ${nftTokenContract.deployTransaction.hash}`
    );

    console.log(
        "The contract is NOT deployed yet; we must wait until it is mined..."
    );

    await nftTokenContract.deployed();

    console.log("Minted...");
};
export default func;
func.id = "deploy";
func.tags = ["halloween"];
