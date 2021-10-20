pragma solidity 0.8.4;

import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockChainlinkCoordinator {

  constructor() public {
  }

  function sendRandom(address _client, uint256 _random) public {
    VRFConsumerBase(_client).rawFulfillRandomness(bytes32(0x4042994640429946404299464042994640429946404299464042994640429946), _random);
  }
}
