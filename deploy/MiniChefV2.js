const { ChainId } = require("@sushiswap/sdk")


const ACE = {
  [ChainId.MATIC]: '0x0b3F868E0BE5597D5DB7fEB59E1CADBb0fdDa50a',
  80001: '0x4654bb73BAfbFb8A3952f1c65D1310e0e57d6101'
}

module.exports = async function ({ ethers, deployments, getNamedAccounts }) {
  const { deploy } = deployments

  const { deployer, dev } = await getNamedAccounts()

  const chainId = await getChainId()

  let aceAddress;

  if (chainId === '31337') {
    aceAddress = (await deployments.get("AceToken")).address
  } else if (chainId in ACE) {
    aceAddress = ACE[chainId]
  } else {
    throw Error("No ACE!")
  }

  await deploy("MiniChefV2", {
    from: deployer,
    args: [aceAddress],
    log: true,
    deterministicDeployment: false
  })

  const miniChefV2 = await ethers.getContract("MiniChefV2")
  if (await miniChefV2.owner() !== dev) {
    console.log("Transfer ownership of MiniChef to dev")
    await (await miniChefV2.transferOwnership(dev, true, false)).wait()
  }
}

module.exports.tags = ["MiniChefV2"]
// module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02"]
