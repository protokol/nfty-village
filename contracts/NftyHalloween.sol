// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "hardhat/console.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract NftyHalloween is
    ERC721,
    ERC721Enumerable,
    Pausable,
    Ownable,
    VRFConsumerBase
{
    using Strings for uint256;
    
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;
    
    uint256 public constant MAX_TOKENS = 9000;
    string private _nftyBaseURI = "";
    address nftyPass;

    mapping(uint256 => address) private claimed;
    
    uint256 public seed;
    
    uint256 public chainlinkFee;
    bytes32 public chainlinkHash;
    
    constructor(
        string memory baseURI,  
        address _nftyPass,
        address _linkToken,
        address _chainlinkCoordinator,
        uint256 _chainlinkFee,
        bytes32 _chainlinkHash
    )
    ERC721("NftyHalloween", "NFTYH")
    VRFConsumerBase(_chainlinkCoordinator, _linkToken)
    {
        _nftyBaseURI = baseURI;
        chainlinkFee = _chainlinkFee;
        chainlinkHash = _chainlinkHash;
        nftyPass = _nftyPass;
    }

    function mint(uint256 pass) external whenNotPaused {
        require(IERC721(nftyPass).ownerOf(pass) == msg.sender, "Pass not owned by sender");
        require(claimed[pass] == address(0), "Pass already used");

        claimed[pass] = msg.sender;
        _safeMint(msg.sender, _tokenIdCounter.current());
        _tokenIdCounter.increment();
    }

    function setBaseURI(string memory baseURI) external onlyOwner {
        _nftyBaseURI = baseURI;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _nftyBaseURI;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function setChainlinkConfig(uint256 _chainlinkFee, bytes32 _chainlinkHash) external onlyOwner {
        chainlinkFee = _chainlinkFee;
        chainlinkHash = _chainlinkHash;
    }

    function seedReveal() public onlyOwner {
        require(seed == 0, "Sead already generated");
        require(LINK.balanceOf(address(this)) >= chainlinkFee, "LINK_BALANCE_NOT_ENOUGH");
        requestRandomness(chainlinkHash, chainlinkFee);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        string memory tokenURI_ = metadataOf(tokenId);
        string memory base_ = _baseURI();

        if (seed == 0) {
            return base_;
        }
        return string(abi.encodePacked(base_, tokenURI_));
    }

    function metadataOf(uint256 _tokenId) public view returns (string memory) {
        require(_tokenId < totalSupply(), "Invalid token id");

        uint256 seed_ = seed;
        if (seed_ == 0) {
            return "";
        }

        uint256[] memory randomIds = new uint256[](MAX_TOKENS);
        for (uint256 i = 0; i < MAX_TOKENS; i++) {
            randomIds[i] = i;
        }

        for (uint256 i = 0; i < MAX_TOKENS - 1; i++) {
            uint256 j = i + (uint256(keccak256(abi.encode(seed_, i))) % (MAX_TOKENS - i));
            (randomIds[i], randomIds[j]) = (randomIds[j], randomIds[i]);
        }

        return randomIds[_tokenId].toString();
    }

    function fulfillRandomness(bytes32 _requestId, uint256 _randomNumber) internal override {
        require(seed == 0, "Sead already generated");
        seed = _randomNumber;
    }
}
