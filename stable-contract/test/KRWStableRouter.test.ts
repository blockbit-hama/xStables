import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Contract, Signer } from 'ethers';

describe('KRWStableRouter', function () {
  let krwStableRouter: Contract;
  let krwOracle: Contract;
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  let feeRecipient: Signer;

  // Mock tokens
  let usdc: Contract;
  let usdt: Contract;
  let krwx: Contract;
  let krt: Contract;

  const BPS_DENOMINATOR = 10000;
  const KRW_DEPEG_THRESHOLD_BPS = 50; // 0.5%

  beforeEach(async function () {
    [owner, user1, user2, feeRecipient] = await ethers.getSigners();

    // Deploy KRW Oracle
    const KRWOracle = await ethers.getContractFactory('KRWOracle');
    krwOracle = await KRWOracle.deploy();
    await krwOracle.deployed();

    // Deploy KRW Stable Router
    const KRWStableRouter = await ethers.getContractFactory('KRWStableRouter');
    krwStableRouter = await KRWStableRouter.deploy(
      await feeRecipient.getAddress(),
      krwOracle.address
    );
    await krwStableRouter.deployed();

    // Deploy mock ERC20 tokens
    const MockERC20 = await ethers.getContractFactory('MockERC20');
    
    usdc = await MockERC20.deploy('USD Coin', 'USDC', 6);
    await usdc.deployed();

    usdt = await MockERC20.deploy('Tether USD', 'USDT', 6);
    await usdt.deployed();

    krwx = await MockERC20.deploy('KRW Stablecoin', 'KRWx', 18);
    await krwx.deployed();

    krt = await MockERC20.deploy('Klaytn KRW', 'KRT', 18);
    await krt.deployed();

    // Register KRW stablecoins
    await krwOracle.registerKRWStable(
      krwx.address,
      'KRWx',
      ethers.utils.parseEther('1'), // 1 KRW = 1e18
      KRW_DEPEG_THRESHOLD_BPS
    );

    await krwOracle.registerKRWStable(
      krt.address,
      'KRT',
      ethers.utils.parseEther('1'), // 1 KRW = 1e18
      KRW_DEPEG_THRESHOLD_BPS
    );

    // Register tokens in router
    await krwStableRouter.registerKRWStable(
      krwx.address,
      ethers.utils.parseEther('1'),
      KRW_DEPEG_THRESHOLD_BPS
    );

    await krwStableRouter.registerKRWStable(
      krt.address,
      ethers.utils.parseEther('1'),
      KRW_DEPEG_THRESHOLD_BPS
    );

    // Update token support
    await krwStableRouter.updateTokenSupport(usdc.address, true);
    await krwStableRouter.updateTokenSupport(usdt.address, true);
  });

  describe('Deployment', function () {
    it('Should set the correct owner', async function () {
      expect(await krwStableRouter.owner()).to.equal(await owner.getAddress());
    });

    it('Should set the correct fee recipient', async function () {
      expect(await krwStableRouter.feeRecipient()).to.equal(await feeRecipient.getAddress());
    });

    it('Should set the correct KRW oracle', async function () {
      expect(await krwStableRouter.krwOracle()).to.equal(krwOracle.address);
    });

    it('Should set the correct default service fee', async function () {
      expect(await krwStableRouter.defaultServiceFeeBps()).to.equal(5); // 0.05%
    });
  });

  describe('KRW Stablecoin Registration', function () {
    it('Should register KRW stablecoin correctly', async function () {
      const stableInfo = await krwStableRouter.getKRWStableInfo(krwx.address);
      
      expect(stableInfo.token).to.equal(krwx.address);
      expect(stableInfo.pegPrice).to.equal(ethers.utils.parseEther('1'));
      expect(stableInfo.isActive).to.be.true;
      expect(stableInfo.depegThresholdBps).to.equal(KRW_DEPEG_THRESHOLD_BPS);
    });

    it('Should emit KRWStableRegistered event', async function () {
      const newToken = await ethers.getContractFactory('MockERC20');
      const newKRWStable = await newToken.deploy('New KRW', 'NKRW', 18);
      await newKRWStable.deployed();

      await expect(
        krwStableRouter.registerKRWStable(
          newKRWStable.address,
          ethers.utils.parseEther('1'),
          KRW_DEPEG_THRESHOLD_BPS
        )
      ).to.emit(krwStableRouter, 'KRWStableRegistered')
        .withArgs(
          newKRWStable.address,
          ethers.utils.parseEther('1'),
          KRW_DEPEG_THRESHOLD_BPS
        );
    });

    it('Should reject invalid token address', async function () {
      await expect(
        krwStableRouter.registerKRWStable(
          ethers.constants.AddressZero,
          ethers.utils.parseEther('1'),
          KRW_DEPEG_THRESHOLD_BPS
        )
      ).to.be.revertedWith('Invalid token address');
    });

    it('Should reject threshold too high', async function () {
      await expect(
        krwStableRouter.registerKRWStable(
          krwx.address,
          ethers.utils.parseEther('1'),
          2000 // 20% - too high
        )
      ).to.be.revertedWith('Threshold too high');
    });
  });

  describe('Service Fee Management', function () {
    it('Should set service fee correctly', async function () {
      await krwStableRouter.setServiceFee(krwx.address, 10); // 0.1%
      
      const fee = await krwStableRouter.getServiceFee(krwx.address);
      expect(fee).to.equal(10);
    });

    it('Should emit ServiceFeeUpdated event', async function () {
      await expect(
        krwStableRouter.setServiceFee(krwx.address, 10)
      ).to.emit(krwStableRouter, 'ServiceFeeUpdated')
        .withArgs(krwx.address, 10);
    });

    it('Should reject fee too high', async function () {
      await expect(
        krwStableRouter.setServiceFee(krwx.address, 100) // 1% - too high
      ).to.be.revertedWith('Fee too high');
    });

    it('Should use default fee when not set', async function () {
      const fee = await krwStableRouter.getServiceFee(usdc.address);
      expect(fee).to.equal(5); // Default 0.05%
    });
  });

  describe('Router Authorization', function () {
    it('Should authorize router correctly', async function () {
      const mockRouter = await user1.getAddress();
      
      await krwStableRouter.setRouterAuthorization(mockRouter, true);
      expect(await krwStableRouter.authorizedRouters(mockRouter)).to.be.true;
    });

    it('Should emit RouterAuthorized event', async function () {
      const mockRouter = await user1.getAddress();
      
      await expect(
        krwStableRouter.setRouterAuthorization(mockRouter, true)
      ).to.emit(krwStableRouter, 'RouterAuthorized')
        .withArgs(mockRouter, true);
    });
  });

  describe('Depeg Detection', function () {
    it('Should detect depeg correctly', async function () {
      // Update price to cause depeg (2% deviation)
      await krwOracle.updatePrice(
        krwx.address,
        ethers.utils.parseEther('1.02'), // 2% above peg
        95 // 95% confidence
      );

      const [isDepegged, deviationBps] = await krwStableRouter.checkDepegStatus(krwx.address);
      
      expect(isDepegged).to.be.true;
      expect(deviationBps).to.be.greaterThan(KRW_DEPEG_THRESHOLD_BPS);
    });

    it('Should not detect depeg within threshold', async function () {
      // Update price within threshold (0.3% deviation)
      await krwOracle.updatePrice(
        krwx.address,
        ethers.utils.parseEther('1.003'), // 0.3% above peg
        95 // 95% confidence
      );

      const [isDepegged, deviationBps] = await krwStableRouter.checkDepegStatus(krwx.address);
      
      expect(isDepegged).to.be.false;
      expect(deviationBps).to.be.lessThan(KRW_DEPEG_THRESHOLD_BPS);
    });

    it('Should emit DepegDetected event', async function () {
      await expect(
        krwOracle.updatePrice(
          krwx.address,
          ethers.utils.parseEther('1.02'), // 2% above peg
          95
        )
      ).to.emit(krwStableRouter, 'DepegDetected');
    });
  });

  describe('TTV Calculation', function () {
    it('Should calculate TTV correctly', async function () {
      const amountIn = ethers.utils.parseEther('1000'); // 1000 tokens
      
      const routeInfo = {
        router: await user1.getAddress(),
        data: '0x',
        gasEstimate: 200000,
        totalCostUsd: ethers.utils.parseEther('10'), // $10
        isKRWDirect: true
      };

      const ttv = await krwStableRouter.calculateTTV(
        krwx.address,
        krt.address,
        amountIn,
        routeInfo
      );

      expect(ttv).to.be.greaterThan(0);
    });
  });

  describe('Access Control', function () {
    it('Should allow only owner to register KRW stable', async function () {
      await expect(
        krwStableRouter.connect(user1).registerKRWStable(
          krwx.address,
          ethers.utils.parseEther('1'),
          KRW_DEPEG_THRESHOLD_BPS
        )
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Should allow only owner to set service fee', async function () {
      await expect(
        krwStableRouter.connect(user1).setServiceFee(krwx.address, 10)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('Should allow only owner to authorize router', async function () {
      await expect(
        krwStableRouter.connect(user1).setRouterAuthorization(
          await user2.getAddress(),
          true
        )
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });
  });

  describe('Pause Functionality', function () {
    it('Should allow owner to pause', async function () {
      await krwStableRouter.emergencyPause();
      expect(await krwStableRouter.paused()).to.be.true;
    });

    it('Should allow owner to unpause', async function () {
      await krwStableRouter.emergencyPause();
      await krwStableRouter.emergencyUnpause();
      expect(await krwStableRouter.paused()).to.be.false;
    });

    it('Should reject non-owner pause', async function () {
      await expect(
        krwStableRouter.connect(user1).emergencyPause()
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });
  });

  describe('Edge Cases', function () {
    it('Should handle zero amount', async function () {
      const amountIn = 0;
      
      const routeInfo = {
        router: await user1.getAddress(),
        data: '0x',
        gasEstimate: 200000,
        totalCostUsd: 0,
        isKRWDirect: true
      };

      const ttv = await krwStableRouter.calculateTTV(
        krwx.address,
        krt.address,
        amountIn,
        routeInfo
      );

      expect(ttv).to.equal(0);
    });

    it('Should handle inactive KRW stable', async function () {
      // Deactivate KRW stable
      await krwOracle.deactivateKRWStable(krwx.address);
      
      const [isDepegged, deviationBps] = await krwStableRouter.checkDepegStatus(krwx.address);
      
      expect(isDepegged).to.be.false;
      expect(deviationBps).to.equal(0);
    });
  });
});