import { assert, expect } from "chai";
import { Signer } from "ethers";
import { ethers, web3 } from "hardhat";

import {
    MockChainlinkCoordinator,
    MockChainlinkCoordinator__factory,
    MockERC20,
    MockERC20__factory,
    NftyHalloween,
    NftyHalloween__factory,
    NftyPass,
    NftyPass__factory,
} from "../typechain";

describe("Nfty Halloween", function () {
    let accounts: Signer[];
    const uri = "www.placeholder.com/";
    const linkFeeAmount = web3.utils.toWei("1", "ether");

    let chainLinkCoordinator: MockChainlinkCoordinator;
    let linkToken: MockERC20;
    let passContract: NftyPass;
    let halloweenContract: NftyHalloween;

    beforeEach(async function () {
        accounts = await ethers.getSigners();

        const chainLinkCoordinatorFactory = (await ethers.getContractFactory(
            "MockChainlinkCoordinator",
            accounts[0]
        )) as MockChainlinkCoordinator__factory;
        chainLinkCoordinator = await chainLinkCoordinatorFactory.deploy();

        const linkTokenFactory = (await ethers.getContractFactory(
            "MockERC20",
            accounts[0]
        )) as MockERC20__factory;
        linkToken = await linkTokenFactory.deploy(
            "LINK",
            "LINK",
            web3.utils.toWei("2", "ether")
        );

        const passFactory = (await ethers.getContractFactory(
            "NftyPass",
            accounts[0]
        )) as NftyPass__factory;
        passContract = await passFactory.deploy("some-uri");

        const halloweenFactory = (await ethers.getContractFactory(
            "NftyHalloween",
            accounts[0]
        )) as NftyHalloween__factory;
        halloweenContract = await halloweenFactory.deploy(
            uri,
            passContract.address,
            linkToken.address,
            chainLinkCoordinator.address,
            linkFeeAmount,
            "0x0000000000000000000000000000000000000000000000000000000000000000"
        );
    });
    describe("Mint", function () {
        beforeEach(async () => {
            const value = await passContract.PRICE();

            await passContract.safeMint(await accounts[0].getAddress(), {
                value,
            });
            await passContract.safeMint(await accounts[1].getAddress(), {
                value,
            });
            await passContract.safeMint(await accounts[2].getAddress(), {
                value,
            });
        });
        it("Should Mint successfully", async function () {
            expect(await halloweenContract.totalSupply()).to.equal(0);

            await halloweenContract.connect(accounts[0]).mint(0);
            await halloweenContract.connect(accounts[1]).mint(1);
            await halloweenContract.connect(accounts[2]).mint(2);

            expect(await halloweenContract.totalSupply()).to.equal(3);
        });

        it("Should Throw Pass not owned by sender", async function () {
            expect(
                halloweenContract.connect(accounts[0]).mint(1)
            ).eventually.to.be.rejectedWith("Pass not owned by sender");
        });

        it("Should Throw Pass already used", async function () {
            await halloweenContract.connect(accounts[0]).mint(0);

            expect(
                halloweenContract.connect(accounts[0]).mint(0)
            ).eventually.to.be.rejectedWith("Pass already used");
        });

        it("Should Mint - with different address", async function () {
            await passContract
                .connect(accounts[0])
                .transferFrom(
                    await accounts[0].getAddress(),
                    await accounts[1].getAddress(),
                    0
                );

            // tslint:disable-next-line:no-unused-expression
            expect(halloweenContract.connect(accounts[1]).mint(0)).eventually.to
                .be.fulfilled;
        });

        it("Should Throw Pass already used - with different address", async function () {
            await halloweenContract.connect(accounts[0]).mint(0);
            await passContract
                .connect(accounts[0])
                .transferFrom(
                    await accounts[0].getAddress(),
                    await accounts[1].getAddress(),
                    0
                );

            expect(
                halloweenContract.connect(accounts[1]).mint(0)
            ).eventually.to.be.rejectedWith("Pass already used");
        });
    });

    describe("reveal", () => {
        const randomId = "991122334455667788990011223344556677889900";
        beforeEach(async () => {
            await linkToken.transfer(halloweenContract.address, linkFeeAmount);
        });

        it("Should reveal successfully", async () => {
            await halloweenContract.connect(accounts[0]).seedReveal();

            await chainLinkCoordinator.sendRandom(
                halloweenContract.address,
                randomId
            );

            assert.equal((await halloweenContract.seed()).toString(), randomId);
        });

        it("Should not be able to reveal two times", async () => {
            await halloweenContract.connect(accounts[0]).seedReveal();
            await chainLinkCoordinator.sendRandom(
                halloweenContract.address,
                randomId
            );

            expect(
                halloweenContract.connect(accounts[0]).seedReveal()
            ).eventually.to.be.rejectedWith("Sead already generated");
        });

        it("Should not be able to sendRandom two times", async () => {
            await halloweenContract.connect(accounts[0]).seedReveal();
            await chainLinkCoordinator.sendRandom(
                halloweenContract.address,
                randomId
            );

            expect(
                chainLinkCoordinator
                    .connect(accounts[0])
                    .sendRandom(halloweenContract.address, randomId)
            ).eventually.to.be.rejectedWith("Sead already generated");
        });
    });

    describe("metadataOf and tokenURI", () => {
        beforeEach(async () => {
            await linkToken.transfer(halloweenContract.address, linkFeeAmount);

            const randomId = "991122334455667788990011223344556677889900";
            await halloweenContract.seedReveal({
                from: await accounts[0].getAddress(),
            });
            await chainLinkCoordinator.sendRandom(
                halloweenContract.address,
                randomId
            );

            const value = await passContract.PRICE();

            await passContract.safeMint(await accounts[0].getAddress(), {
                value,
            });
            await passContract.safeMint(await accounts[1].getAddress(), {
                value,
            });
            await passContract.safeMint(await accounts[2].getAddress(), {
                value,
            });

            await halloweenContract.connect(accounts[0]).mint(0);
            await halloweenContract.connect(accounts[1]).mint(1);
            await halloweenContract.connect(accounts[2]).mint(2);
        });
        it("Should return correct metadata", async () => {
            // TODO make sure to check for expected values
            assert.equal(await halloweenContract.metadataOf(0), "537");
            assert.equal(
                await halloweenContract.tokenURI(0),
                "www.placeholder.com/537"
            );

            assert.equal(await halloweenContract.metadataOf(1), "1688");
            assert.equal(
                await halloweenContract.tokenURI(1),
                "www.placeholder.com/1688"
            );

            assert.equal(await halloweenContract.metadataOf(2), "7198");
            assert.equal(
                await halloweenContract.tokenURI(2),
                "www.placeholder.com/7198"
            );
        });

        it("Should Throw if token doesn't yet exits", async () => {
            expect(
                halloweenContract.metadataOf(3)
            ).eventually.to.be.rejectedWith();
        });

        it("Should Throw Invalid token id", async () => {
            expect(
                halloweenContract.metadataOf(9001)
            ).eventually.to.be.rejectedWith("Invalid token id");
        });
    });
});
