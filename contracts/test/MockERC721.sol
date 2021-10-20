pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MockERC721 is ERC721 {
  constructor(string memory _name, string memory _symbol) public ERC721(_name, _symbol) {
  }

  function mint(address _to, uint256 _id) external {
    _mint(_to, _id);
  }
}
