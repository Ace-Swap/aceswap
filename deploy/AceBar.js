module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  const sushi = await deployments.get("AceToken")

  await deploy("AceBar", {
    from: deployer,
    args: [sushi.address],
    log: true,
    deterministicDeployment: false
  })
}

module.exports.tags = ["AceBar"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "AceToken"]
