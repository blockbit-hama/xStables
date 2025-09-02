// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title KRWStableRouter
 * @dev KRW 스테이블코인 전용 라우터 - 최적화된 TTV 계산 및 디페그 보호
 * @author xStables Team
 */
contract KRWStableRouter is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // ============ Constants ============
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant MAX_SLIPPAGE_BPS = 1000; // 10%
    uint256 public constant MAX_SERVICE_FEE_BPS = 50; // 0.5%
    
    // KRW 스테이블코인 디페그 임계값 (0.5%)
    uint256 public constant KRW_DEPEG_THRESHOLD_BPS = 50;
    
    // ============ Structs ============
    struct SwapParams {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 minAmountOut;
        uint256 slippageBps;
        address recipient;
        bytes data;
    }

    struct RouteInfo {
        address router;
        bytes data;
        uint256 gasEstimate;
        uint256 totalCostUsd;
        bool isKRWDirect;
    }

    struct KRWStableInfo {
        address token;
        uint256 pegPrice; // KRW 기준 페그 가격 (18 decimals)
        uint256 lastUpdateTime;
        bool isActive;
        uint256 depegThresholdBps;
    }

    // ============ State Variables ============
    mapping(address => bool) public supportedTokens;
    mapping(address => KRWStableInfo) public krwStables;
    mapping(address => bool) public authorizedRouters;
    mapping(address => uint256) public serviceFees; // bps
    
    uint256 public defaultServiceFeeBps = 5; // 0.05%
    address public feeRecipient;
    address public krwOracle;
    
    // ============ Events ============
    event SwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 serviceFee,
        address router,
        bool isKRWDirect
    );

    event KRWStableRegistered(
        address indexed token,
        uint256 pegPrice,
        uint256 depegThresholdBps
    );

    event DepegDetected(
        address indexed token,
        uint256 currentPrice,
        uint256 pegPrice,
        uint256 deviationBps
    );

    event ServiceFeeUpdated(address indexed token, uint256 newFeeBps);
    event RouterAuthorized(address indexed router, bool authorized);

    // ============ Modifiers ============
    modifier onlySupportedToken(address token) {
        require(supportedTokens[token], "Token not supported");
        _;
    }

    modifier onlyKRWStable(address token) {
        require(krwStables[token].isActive, "Not a KRW stablecoin");
        _;
    }

    // ============ Constructor ============
    constructor(address _feeRecipient, address _krwOracle) {
        feeRecipient = _feeRecipient;
        krwOracle = _krwOracle;
    }

    // ============ Core Functions ============

    /**
     * @dev KRW 스테이블코인 간 최적화된 스왑 실행
     * @param params 스왑 파라미터
     * @param routes 가능한 라우트들
     * @return amountOut 실제 출력 금액
     */
    function swapKRWStables(
        SwapParams memory params,
        RouteInfo[] memory routes
    ) external payable nonReentrant whenNotPaused returns (uint256 amountOut) {
        require(routes.length > 0, "No routes provided");
        
        // KRW 스테이블코인 검증
        require(krwStables[params.tokenIn].isActive, "TokenIn not KRW stable");
        require(krwStables[params.tokenOut].isActive, "TokenOut not KRW stable");
        
        // 디페그 체크
        _checkDepeg(params.tokenIn);
        _checkDepeg(params.tokenOut);
        
        // 최적 라우트 선택 (TTV 기준)
        RouteInfo memory bestRoute = _selectBestRoute(routes, params);
        
        // 토큰 전송
        IERC20(params.tokenIn).safeTransferFrom(
            msg.sender,
            address(this),
            params.amountIn
        );
        
        // 서비스 수수료 계산
        uint256 serviceFee = _calculateServiceFee(params.amountIn, params.tokenIn);
        uint256 amountAfterFee = params.amountIn - serviceFee;
        
        // 라우터에 토큰 전송
        IERC20(params.tokenIn).safeTransfer(bestRoute.router, amountAfterFee);
        
        // 스왑 실행
        (bool success, bytes memory returnData) = bestRoute.router.call(
            bestRoute.data
        );
        require(success, "Swap execution failed");
        
        // 출력 토큰 수량 확인
        amountOut = IERC20(params.tokenOut).balanceOf(address(this));
        require(amountOut >= params.minAmountOut, "Insufficient output amount");
        
        // 서비스 수수료 전송
        if (serviceFee > 0) {
            IERC20(params.tokenIn).safeTransfer(feeRecipient, serviceFee);
        }
        
        // 출력 토큰 전송
        IERC20(params.tokenOut).safeTransfer(params.recipient, amountOut);
        
        emit SwapExecuted(
            msg.sender,
            params.tokenIn,
            params.tokenOut,
            params.amountIn,
            amountOut,
            serviceFee,
            bestRoute.router,
            bestRoute.isKRWDirect
        );
    }

    /**
     * @dev USD 스테이블코인과 KRW 스테이블코인 간 스왑
     */
    function swapUSDToKRW(
        SwapParams memory params,
        RouteInfo[] memory routes
    ) external payable nonReentrant whenNotPaused returns (uint256 amountOut) {
        require(routes.length > 0, "No routes provided");
        
        // USD 스테이블코인 검증 (USDC, USDT, DAI 등)
        require(supportedTokens[params.tokenIn], "TokenIn not supported");
        require(krwStables[params.tokenOut].isActive, "TokenOut not KRW stable");
        
        // KRW 스테이블코인 디페그 체크
        _checkDepeg(params.tokenOut);
        
        // 최적 라우트 선택
        RouteInfo memory bestRoute = _selectBestRoute(routes, params);
        
        // 토큰 전송 및 스왑 실행
        IERC20(params.tokenIn).safeTransferFrom(
            msg.sender,
            address(this),
            params.amountIn
        );
        
        uint256 serviceFee = _calculateServiceFee(params.amountIn, params.tokenIn);
        uint256 amountAfterFee = params.amountIn - serviceFee;
        
        IERC20(params.tokenIn).safeTransfer(bestRoute.router, amountAfterFee);
        
        (bool success, bytes memory returnData) = bestRoute.router.call(
            bestRoute.data
        );
        require(success, "Swap execution failed");
        
        amountOut = IERC20(params.tokenOut).balanceOf(address(this));
        require(amountOut >= params.minAmountOut, "Insufficient output amount");
        
        if (serviceFee > 0) {
            IERC20(params.tokenIn).safeTransfer(feeRecipient, serviceFee);
        }
        
        IERC20(params.tokenOut).safeTransfer(params.recipient, amountOut);
        
        emit SwapExecuted(
            msg.sender,
            params.tokenIn,
            params.tokenOut,
            params.amountIn,
            amountOut,
            serviceFee,
            bestRoute.router,
            false
        );
    }

    // ============ Internal Functions ============

    /**
     * @dev 최적 라우트 선택 (TTV 기준)
     */
    function _selectBestRoute(
        RouteInfo[] memory routes,
        SwapParams memory params
    ) internal view returns (RouteInfo memory) {
        require(routes.length > 0, "No routes available");
        
        RouteInfo memory bestRoute = routes[0];
        uint256 bestTTV = bestRoute.totalCostUsd;
        
        for (uint256 i = 1; i < routes.length; i++) {
            if (routes[i].totalCostUsd < bestTTV) {
                bestRoute = routes[i];
                bestTTV = routes[i].totalCostUsd;
            }
        }
        
        return bestRoute;
    }

    /**
     * @dev 서비스 수수료 계산
     */
    function _calculateServiceFee(
        uint256 amount,
        address token
    ) internal view returns (uint256) {
        uint256 feeBps = serviceFees[token] > 0 ? serviceFees[token] : defaultServiceFeeBps;
        return (amount * feeBps) / BPS_DENOMINATOR;
    }

    /**
     * @dev KRW 스테이블코인 디페그 체크
     */
    function _checkDepeg(address token) internal view {
        KRWStableInfo memory stableInfo = krwStables[token];
        require(stableInfo.isActive, "KRW stable not active");
        
        // 오라클에서 현재 가격 조회 (실제 구현에서는 오라클 호출)
        uint256 currentPrice = _getCurrentPrice(token);
        uint256 pegPrice = stableInfo.pegPrice;
        
        uint256 deviationBps = _calculateDeviationBps(currentPrice, pegPrice);
        
        if (deviationBps > stableInfo.depegThresholdBps) {
            emit DepegDetected(token, currentPrice, pegPrice, deviationBps);
            revert("KRW stablecoin depegged");
        }
    }

    /**
     * @dev 현재 가격 조회 (오라클 연동)
     */
    function _getCurrentPrice(address token) internal view returns (uint256) {
        // 실제 구현에서는 KRW 오라클에서 가격 조회
        // 여기서는 예시로 페그 가격 반환
        return krwStables[token].pegPrice;
    }

    /**
     * @dev 가격 편차 계산 (bps)
     */
    function _calculateDeviationBps(
        uint256 currentPrice,
        uint256 pegPrice
    ) internal pure returns (uint256) {
        if (currentPrice >= pegPrice) {
            return ((currentPrice - pegPrice) * BPS_DENOMINATOR) / pegPrice;
        } else {
            return ((pegPrice - currentPrice) * BPS_DENOMINATOR) / pegPrice;
        }
    }

    // ============ Admin Functions ============

    /**
     * @dev KRW 스테이블코인 등록
     */
    function registerKRWStable(
        address token,
        uint256 pegPrice,
        uint256 depegThresholdBps
    ) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(depegThresholdBps <= MAX_SLIPPAGE_BPS, "Threshold too high");
        
        krwStables[token] = KRWStableInfo({
            token: token,
            pegPrice: pegPrice,
            lastUpdateTime: block.timestamp,
            isActive: true,
            depegThresholdBps: depegThresholdBps
        });
        
        supportedTokens[token] = true;
        
        emit KRWStableRegistered(token, pegPrice, depegThresholdBps);
    }

    /**
     * @dev 토큰 지원 상태 업데이트
     */
    function updateTokenSupport(address token, bool supported) external onlyOwner {
        supportedTokens[token] = supported;
    }

    /**
     * @dev 라우터 권한 관리
     */
    function setRouterAuthorization(address router, bool authorized) external onlyOwner {
        authorizedRouters[router] = authorized;
        emit RouterAuthorized(router, authorized);
    }

    /**
     * @dev 서비스 수수료 설정
     */
    function setServiceFee(address token, uint256 feeBps) external onlyOwner {
        require(feeBps <= MAX_SERVICE_FEE_BPS, "Fee too high");
        serviceFees[token] = feeBps;
        emit ServiceFeeUpdated(token, feeBps);
    }

    /**
     * @dev 기본 서비스 수수료 설정
     */
    function setDefaultServiceFee(uint256 feeBps) external onlyOwner {
        require(feeBps <= MAX_SERVICE_FEE_BPS, "Fee too high");
        defaultServiceFeeBps = feeBps;
    }

    /**
     * @dev 수수료 수취자 변경
     */
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid address");
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev KRW 오라클 주소 변경
     */
    function setKRWOracle(address _krwOracle) external onlyOwner {
        require(_krwOracle != address(0), "Invalid address");
        krwOracle = _krwOracle;
    }

    /**
     * @dev KRW 스테이블코인 페그 가격 업데이트
     */
    function updateKRWPegPrice(address token, uint256 newPegPrice) external onlyOwner {
        require(krwStables[token].isActive, "Token not registered");
        krwStables[token].pegPrice = newPegPrice;
        krwStables[token].lastUpdateTime = block.timestamp;
    }

    /**
     * @dev 긴급 일시정지
     */
    function emergencyPause() external onlyOwner {
        _pause();
    }

    /**
     * @dev 일시정지 해제
     */
    function emergencyUnpause() external onlyOwner {
        _unpause();
    }

    // ============ View Functions ============

    /**
     * @dev KRW 스테이블코인 정보 조회
     */
    function getKRWStableInfo(address token) external view returns (KRWStableInfo memory) {
        return krwStables[token];
    }

    /**
     * @dev 서비스 수수료 조회
     */
    function getServiceFee(address token) external view returns (uint256) {
        return serviceFees[token] > 0 ? serviceFees[token] : defaultServiceFeeBps;
    }

    /**
     * @dev TTV 계산 (가스비 + 수수료 + 슬리피지)
     */
    function calculateTTV(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        RouteInfo memory route
    ) external view returns (uint256 ttv) {
        uint256 serviceFee = _calculateServiceFee(amountIn, tokenIn);
        uint256 gasCostUsd = route.gasEstimate * tx.gasprice * 1e18 / 1e9; // USD 환산 (간단화)
        
        return serviceFee + gasCostUsd;
    }

    /**
     * @dev 디페그 상태 체크
     */
    function checkDepegStatus(address token) external view returns (bool isDepegged, uint256 deviationBps) {
        KRWStableInfo memory stableInfo = krwStables[token];
        if (!stableInfo.isActive) {
            return (false, 0);
        }
        
        uint256 currentPrice = _getCurrentPrice(token);
        uint256 deviation = _calculateDeviationBps(currentPrice, stableInfo.pegPrice);
        
        return (deviation > stableInfo.depegThresholdBps, deviation);
    }
}