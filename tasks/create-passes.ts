import "@nomiclabs/hardhat-ethers";
import { task } from "hardhat/config";

task("create-passes", "Creates Nfty Passes")
    .addParam("supply", "Number of Passes To Generate")
    .addOptionalParam("contract", "The address of the ERC721 contract")
    .setAction(async (taskArgs, hre) => {
        const contractAddr =
            taskArgs.contract || process.env.NFT_CONTRACT_ADDRESS;
        const supply = taskArgs.supply;

        console.log(
            `Creating ${supply} Passes via contract: ${contractAddr} on network ${hre.network.name}`
        );
        const nftFactory = await hre.ethers.getContractFactory("NftyPass");

        // Get signer information
        const accounts = await hre.ethers.getSigners();
        const signer = accounts[0];

        const nftTokenContract = new hre.ethers.Contract(
            contractAddr,
            nftFactory.interface,
            signer
        );
        const price = await nftTokenContract.PRICE();

        for (let i = 0; i < supply; i++) {
            const createCollectibleTx = await nftTokenContract.safeMint(
                signer.address,
                {
                    value: price,
                }
            );
            console.log(
                `Contract ${contractAddr} created new item. Transaction Hash: ${createCollectibleTx.hash}`
            );
        }
    });

export default {
    solidity: "0.8.4",
};
