import { expect } from "chai";
import { prepare, deploy, getBigNumber, createSLP } from "./utilities"

describe("AceMaker", function () {
  before(async function () {
    await prepare(this, ["AceMaker", "AceBar", "AceMakerExploitMock", "ERC20Mock", "UniswapV2Factory", "UniswapV2Pair"])
  })

  beforeEach(async function () {
    await deploy(this, [
      ["ace", this.ERC20Mock, ["ACE", "ACE", getBigNumber("10000000")]],
      ["dai", this.ERC20Mock, ["DAI", "DAI", getBigNumber("10000000")]],
      ["mic", this.ERC20Mock, ["MIC", "MIC", getBigNumber("10000000")]],
      ["usdc", this.ERC20Mock, ["USDC", "USDC", getBigNumber("10000000")]],
      ["weth", this.ERC20Mock, ["WETH", "ETH", getBigNumber("10000000")]],
      ["strudel", this.ERC20Mock, ["$TRDL", "$TRDL", getBigNumber("10000000")]],
      ["factory", this.UniswapV2Factory, [this.alice.address]],
    ])
    await deploy(this, [["bar", this.AceBar, [this.ace.address]]])
    await deploy(this, [["aceMaker", this.AceMaker, [this.factory.address, this.bar.address, this.ace.address, this.weth.address]]])
    await deploy(this, [["exploiter", this.AceMakerExploitMock, [this.aceMaker.address]]])
    await createSLP(this, "aceEth", this.ace, this.weth, getBigNumber(10))
    await createSLP(this, "strudelEth", this.strudel, this.weth, getBigNumber(10))
    await createSLP(this, "daiEth", this.dai, this.weth, getBigNumber(10))
    await createSLP(this, "usdcEth", this.usdc, this.weth, getBigNumber(10))
    await createSLP(this, "micUSDC", this.mic, this.usdc, getBigNumber(10))
    await createSLP(this, "aceUSDC", this.ace, this.usdc, getBigNumber(10))
    await createSLP(this, "daiUSDC", this.dai, this.usdc, getBigNumber(10))
    await createSLP(this, "daiMIC", this.dai, this.mic, getBigNumber(10))
  })
  describe("setBridge", function () {
    it("does not allow to set bridge for Ace", async function () {
      await expect(this.aceMaker.setBridge(this.ace.address, this.weth.address)).to.be.revertedWith("AceMaker: Invalid bridge")
    })

    it("does not allow to set bridge for WETH", async function () {
      await expect(this.aceMaker.setBridge(this.weth.address, this.ace.address)).to.be.revertedWith("AceMaker: Invalid bridge")
    })

    it("does not allow to set bridge to itself", async function () {
      await expect(this.aceMaker.setBridge(this.dai.address, this.dai.address)).to.be.revertedWith("AceMaker: Invalid bridge")
    })

    it("emits correct event on bridge", async function () {
      await expect(this.aceMaker.setBridge(this.dai.address, this.ace.address))
        .to.emit(this.aceMaker, "LogBridgeSet")
        .withArgs(this.dai.address, this.ace.address)
    })
  })
  describe("convert", function () {
    it("should convert ACE - ETH", async function () {
      await this.aceEth.transfer(this.aceMaker.address, getBigNumber(1))
      await this.aceMaker.convert(this.ace.address, this.weth.address)
      expect(await this.ace.balanceOf(this.aceMaker.address)).to.equal(0)
      expect(await this.aceEth.balanceOf(this.aceMaker.address)).to.equal(0)
      expect(await this.ace.balanceOf(this.bar.address)).to.equal("1897569270781234370")
    })

    it("should convert USDC - ETH", async function () {
      await this.usdcEth.transfer(this.aceMaker.address, getBigNumber(1))
      await this.aceMaker.convert(this.usdc.address, this.weth.address)
      expect(await this.ace.balanceOf(this.aceMaker.address)).to.equal(0)
      expect(await this.usdcEth.balanceOf(this.aceMaker.address)).to.equal(0)
      expect(await this.ace.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("should convert $TRDL - ETH", async function () {
      await this.strudelEth.transfer(this.aceMaker.address, getBigNumber(1))
      await this.aceMaker.convert(this.strudel.address, this.weth.address)
      expect(await this.ace.balanceOf(this.aceMaker.address)).to.equal(0)
      expect(await this.strudelEth.balanceOf(this.aceMaker.address)).to.equal(0)
      expect(await this.ace.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("should convert USDC - ACE", async function () {
      await this.aceUSDC.transfer(this.aceMaker.address, getBigNumber(1))
      await this.aceMaker.convert(this.usdc.address, this.ace.address)
      expect(await this.ace.balanceOf(this.aceMaker.address)).to.equal(0)
      expect(await this.aceUSDC.balanceOf(this.aceMaker.address)).to.equal(0)
      expect(await this.ace.balanceOf(this.bar.address)).to.equal("1897569270781234370")
    })

    it("should convert using standard ETH path", async function () {
      await this.daiEth.transfer(this.aceMaker.address, getBigNumber(1))
      await this.aceMaker.convert(this.dai.address, this.weth.address)
      expect(await this.ace.balanceOf(this.aceMaker.address)).to.equal(0)
      expect(await this.daiEth.balanceOf(this.aceMaker.address)).to.equal(0)
      expect(await this.ace.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("converts MIC/USDC using more complex path", async function () {
      await this.micUSDC.transfer(this.aceMaker.address, getBigNumber(1))
      await this.aceMaker.setBridge(this.usdc.address, this.ace.address)
      await this.aceMaker.setBridge(this.mic.address, this.usdc.address)
      await this.aceMaker.convert(this.mic.address, this.usdc.address)
      expect(await this.ace.balanceOf(this.aceMaker.address)).to.equal(0)
      expect(await this.micUSDC.balanceOf(this.aceMaker.address)).to.equal(0)
      expect(await this.ace.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("converts DAI/USDC using more complex path", async function () {
      await this.daiUSDC.transfer(this.aceMaker.address, getBigNumber(1))
      await this.aceMaker.setBridge(this.usdc.address, this.ace.address)
      await this.aceMaker.setBridge(this.dai.address, this.usdc.address)
      await this.aceMaker.convert(this.dai.address, this.usdc.address)
      expect(await this.ace.balanceOf(this.aceMaker.address)).to.equal(0)
      expect(await this.daiUSDC.balanceOf(this.aceMaker.address)).to.equal(0)
      expect(await this.ace.balanceOf(this.bar.address)).to.equal("1590898251382934275")
    })

    it("converts DAI/MIC using two step path", async function () {
      await this.daiMIC.transfer(this.aceMaker.address, getBigNumber(1))
      await this.aceMaker.setBridge(this.dai.address, this.usdc.address)
      await this.aceMaker.setBridge(this.mic.address, this.dai.address)
      await this.aceMaker.convert(this.dai.address, this.mic.address)
      expect(await this.ace.balanceOf(this.aceMaker.address)).to.equal(0)
      expect(await this.daiMIC.balanceOf(this.aceMaker.address)).to.equal(0)
      expect(await this.ace.balanceOf(this.bar.address)).to.equal("1200963016721363748")
    })

    it("reverts if it loops back", async function () {
      await this.daiMIC.transfer(this.aceMaker.address, getBigNumber(1))
      await this.aceMaker.setBridge(this.dai.address, this.mic.address)
      await this.aceMaker.setBridge(this.mic.address, this.dai.address)
      await expect(this.aceMaker.convert(this.dai.address, this.mic.address)).to.be.reverted
    })

    it("reverts if caller is not EOA", async function () {
      await this.aceEth.transfer(this.aceMaker.address, getBigNumber(1))
      await expect(this.exploiter.convert(this.ace.address, this.weth.address)).to.be.revertedWith("AceMaker: must use EOA")
    })

    it("reverts if pair does not exist", async function () {
      await expect(this.aceMaker.convert(this.mic.address, this.micUSDC.address)).to.be.revertedWith("AceMaker: Invalid pair")
    })

    it("reverts if no path is available", async function () {
      await this.micUSDC.transfer(this.aceMaker.address, getBigNumber(1))
      await expect(this.aceMaker.convert(this.mic.address, this.usdc.address)).to.be.revertedWith("AceMaker: Cannot convert")
      expect(await this.ace.balanceOf(this.aceMaker.address)).to.equal(0)
      expect(await this.micUSDC.balanceOf(this.aceMaker.address)).to.equal(getBigNumber(1))
      expect(await this.ace.balanceOf(this.bar.address)).to.equal(0)
    })
  })

  describe("convertMultiple", function () {
    it("should allow to convert multiple", async function () {
      await this.daiEth.transfer(this.aceMaker.address, getBigNumber(1))
      await this.aceEth.transfer(this.aceMaker.address, getBigNumber(1))
      await this.aceMaker.convertMultiple([this.dai.address, this.ace.address], [this.weth.address, this.weth.address])
      expect(await this.ace.balanceOf(this.aceMaker.address)).to.equal(0)
      expect(await this.daiEth.balanceOf(this.aceMaker.address)).to.equal(0)
      expect(await this.ace.balanceOf(this.bar.address)).to.equal("3186583558687783097")
    })
  })
})
