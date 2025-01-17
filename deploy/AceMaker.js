const { WETH } = require("@sushiswap/sdk")

module.exports = async function ({ ethers: { getNamedSigner }, getNamedAccounts, deployments }) {
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()
  const dev = "0x23b065914DC4D8ab052a648a9463546F820BE02f"

  const chainId = await getChainId()

  const factory = await ethers.getContract("UniswapV2Factory")
  const bar = await ethers.getContract("AceBar")
  const ace = await ethers.getContract("AceToken")
  
  let wethAddress;
  
  if (chainId === '31337') {
    wethAddress = (await deployments.get("WETH9Mock")).address
  } else if (chainId in WETH) {
    wethAddress = WETH[chainId].address
  } else {
    throw Error("No WETH!")
  }

  await deploy("AceMaker", {
    from: deployer,
    args: [factory.address, bar.address, ace.address, wethAddress],
    log: true,
    deterministicDeployment: false
  })

  const maker = await ethers.getContract("AceMaker")
  if (await maker.owner() !== dev) {
    console.log("Setting maker owner")
    await (await maker.transferOwnership(dev, true, false)).wait()
  }
}

module.exports.tags = ["AceMaker"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "AceBar", "AceToken"]