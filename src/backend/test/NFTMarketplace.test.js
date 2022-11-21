const { expect } = require("chai");
const { ethers } = require("hardhat");

const toWei = (num) => ethers.utils.parseEther(num.toString());
const fromWei = (num) => ethers.utils.formatEther(num);

describe("NFTMarketplace", function () {
    let NFT;
    let nft;
    let Marketplace;
    let marketplace
    let deployer;
    let addr1;
    let addr2;
    let addrs;
    let feePercent = 1;
    let URI = "sample URI"
    beforeEach(async function () {
        NFT = await ethers.getContractFactory("NFT");
        Marketplace = await ethers.getContractFactory("Marketplace");

        [deployer, addr1, addr2, ...addrs] = await ethers.getSigners();

        nft = await NFT.deploy();
        marketplace = await Marketplace.deploy(feePercent);
    });

    describe("Deployement", function () {
        it("Should tarck name and symbol of the nft collection", async function () {

            const nftName = "Dapp NFT";
            const nftSymbol = "DAPP";
            expect(await nft.name()).to.equal(nftName);
            expect(await nft.symbol()).to.equal(nftSymbol);
        })

        it("Should tarck feeAccount and Feepercent of the nft MarktPlace", async function () {
            expect(await marketplace.feeAccount()).to.equal(deployer.address);
            expect(await marketplace.feePercent()).to.equal(feePercent);
        })
    })

    describe("Minting NFTs", function () {
        it("should track each minted nft", async function () {


            await nft.connect(addr1).mint(URI);
            expect(await nft.tokenCount()).to.equal(1);
            expect(await nft.balanceOf(addr1.address)).to.equal(1);
            expect(await nft.tokenURI(1)).to.equal(URI);

            await nft.connect(addr2).mint(URI);
            expect(await nft.tokenCount()).to.equal(2);
            expect(await nft.balanceOf(addr2.address)).to.equal(1);
            expect(await nft.tokenURI(2)).to.equal(URI);
        })
    })

    describe("making Marketplace items", function () {
        let price = 1
        let result

        beforeEach(async function () {
            await nft.connect(addr1).mint(URI);
            await nft.connect(addr1).setApprovalForAll(marketplace.address, true);

        })
        it("Should created newly items , transfer NFT from seller to marketplace and emit offered event", async function () {
            await expect(marketplace.connect(addr1).makeItem(nft.address, 1, toWei(price)))
                .to.emit(marketplace, "Offered")
                .withArgs(
                    1,
                    nft.address,
                    1,
                    toWei(price),
                    addr1.address
                )
            expect(await nft.ownerOf(1)).to.equal(marketplace.address);
            expect(await marketplace.itemCount()).to.equal(1);
            // console.log();

            const item = await marketplace.items(1)
            // console.log(item.itemId);
            expect(item.ItemId).to.equal(1)
            expect(item.nft).to.equal(nft.address)
            expect(item.tokenId).to.equal(1);
            expect(item.price).to.equal(toWei(price));
            expect(item.sold).to.equal(false);
        })

        it("should fail if price is set to zero", async function () {
            await expect(
                marketplace.connect(addr1).makeItem(nft.address, 1, 0)
            ).to.be.revertedWith("Price must be greater than 0");
        })

    });

    describe("Purchsing marketplace items", function () {

        let price = 1;
        let fee = (feePercent / 100) * price;
        let totalPriceInWei

        beforeEach(async function () {
            await nft.connect(addr1).mint(URI);
            await nft.connect(addr1).setApprovalForAll(marketplace.address, true);
            await marketplace.connect(addr1).makeItem(nft.address, 1, toWei(price))

        })

        it("Should update item as sold , pay seller and transfer nft to buyer , charge fees and emit a Bought event", async function () {
            const sellerInitialEthBalance = await addr1.getBalance();
            const feeAccountInitialEthBalance = await deployer.getBalance();
            totalPriceInWei = await marketplace.getTotalPrice(1);

            await expect(marketplace.connect(addr2).purchaseItem(1, { value: totalPriceInWei }))
                .to.emit(marketplace, "Bought").withArgs(
                    1,
                    nft.address,
                    1,
                    toWei(price),
                    addr1.address,
                    addr2.address
                )

            const sellerFinalEthBalance = await addr1.getBalance();
            const feeAccountFinalEthBalance = await deployer.getBalance();

            expect((await marketplace.items(1)).sold).to.equal(true)

            expect(+fromWei(sellerFinalEthBalance)).to.equal(+price + +fromWei(sellerInitialEthBalance))

            expect(+fromWei(feeAccountFinalEthBalance)).to.equal(+fee + +fromWei(feeAccountInitialEthBalance))

            expect(await nft.ownerOf(1)).to.equal(addr2.address);
        })

        it("Should fail for invaid item ids , sold items and when not enough ether is paid", async function () {

            await expect(
                marketplace.connect(addr2).purchaseItem(2, { value: totalPriceInWei })
            ).to.be.revertedWith("Item does not exist");

            await expect(
                marketplace.connect(addr2).purchaseItem(0, { value: totalPriceInWei })
            ).to.be.revertedWith("Item does not exist");

            // Fails when not enough ether is paid with the transaction. 
            // In this instance, fails when buyer only sends enough ether to cover the price of the nft
            // not the additional market fee.

            await expect(
                marketplace.connect(addr2).purchaseItem(1, { value: toWei(price) })
            ).to.be.revertedWith("not enough ether to cover item price and market fee");

            await marketplace.connect(addr2).purchaseItem(1, { value: totalPriceInWei })

            const addr3 = addrs[0];

            await expect(
                marketplace.connect(addr3).purchaseItem(1, { value: totalPriceInWei })
            ).to.be.revertedWith("item already sold");
        });

    })
})

