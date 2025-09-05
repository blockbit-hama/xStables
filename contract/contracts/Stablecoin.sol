// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Stablecoin
 * @dev ERC20 stablecoin with mint/burn functionality and access controls
 */
contract Stablecoin is ERC20, Ownable, Pausable, ReentrancyGuard {
    // Events
    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);
    event MinterAdded(address indexed account);
    event MinterRemoved(address indexed account);
    event BurnerAdded(address indexed account);
    event BurnerRemoved(address indexed account);

    // Roles
    mapping(address => bool) public minters;
    mapping(address => bool) public burners;

    // Modifiers
    modifier onlyMinter() {
        require(minters[msg.sender], "Stablecoin: caller is not a minter");
        _;
    }

    modifier onlyBurner() {
        require(burners[msg.sender], "Stablecoin: caller is not a burner");
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        if (initialSupply > 0) {
            _mint(msg.sender, initialSupply);
        }
        
        // Owner is automatically a minter and burner
        minters[msg.sender] = true;
        burners[msg.sender] = true;
    }

    /**
     * @dev Mint tokens to a specific address
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) 
        external 
        onlyMinter 
        whenNotPaused 
        nonReentrant 
    {
        require(to != address(0), "Stablecoin: mint to zero address");
        require(amount > 0, "Stablecoin: mint amount must be greater than 0");
        
        _mint(to, amount);
        emit Mint(to, amount);
    }

    /**
     * @dev Burn tokens from a specific address
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burn(address from, uint256 amount) 
        external 
        onlyBurner 
        whenNotPaused 
        nonReentrant 
    {
        require(from != address(0), "Stablecoin: burn from zero address");
        require(amount > 0, "Stablecoin: burn amount must be greater than 0");
        require(balanceOf(from) >= amount, "Stablecoin: burn amount exceeds balance");
        
        _burn(from, amount);
        emit Burn(from, amount);
    }

    /**
     * @dev Add a minter address
     * @param account Address to add as minter
     */
    function addMinter(address account) external onlyOwner {
        require(account != address(0), "Stablecoin: account is zero address");
        require(!minters[account], "Stablecoin: account is already a minter");
        
        minters[account] = true;
        emit MinterAdded(account);
    }

    /**
     * @dev Remove a minter address
     * @param account Address to remove as minter
     */
    function removeMinter(address account) external onlyOwner {
        require(minters[account], "Stablecoin: account is not a minter");
        
        minters[account] = false;
        emit MinterRemoved(account);
    }

    /**
     * @dev Add a burner address
     * @param account Address to add as burner
     */
    function addBurner(address account) external onlyOwner {
        require(account != address(0), "Stablecoin: account is zero address");
        require(!burners[account], "Stablecoin: account is already a burner");
        
        burners[account] = true;
        emit BurnerAdded(account);
    }

    /**
     * @dev Remove a burner address
     * @param account Address to remove as burner
     */
    function removeBurner(address account) external onlyOwner {
        require(burners[account], "Stablecoin: account is not a burner");
        
        burners[account] = false;
        emit BurnerRemoved(account);
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Override transfer to include pause check
     */
    function transfer(address to, uint256 amount) 
        public 
        override 
        whenNotPaused 
        returns (bool) 
    {
        return super.transfer(to, amount);
    }

    /**
     * @dev Override transferFrom to include pause check
     */
    function transferFrom(address from, address to, uint256 amount) 
        public 
        override 
        whenNotPaused 
        returns (bool) 
    {
        return super.transferFrom(from, to, amount);
    }
}
