// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TTVCalculator
 * @dev Total Trade Value 계산 엔진 - 가스비 + 수수료 + 슬리피지 통합 계산
 * @author xStables Team
 */
contract TTVCalculator is Ownable {
    
    // ============ Constants ============
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant USD_DECIMALS = 6; // USDC/USDT decimals
    uint256 public constant KRW_DECIMALS = 18; // KRW decimals
    
    // ============ Structs ============
    struct CostBreakdown {
        uint256 gasCostUsd;      // 가스비 (USD)
        uint256 protocolFeeUsd;  // 프로토콜 수수료 (USD)
        uint256 aggregatorFeeUsd; // 애그리게이터 수수료 (USD)
        uint256 lpFeeUsd;        // LP 수수료 (USD)
        uint256 slippageUsd;     // 슬리피지 비용 (USD)
        uint256 serviceFeeUsd;   // 서비스 수수료 (USD)
        uint256 totalCostUsd;    // 총 비용 (USD)
        uint256 netAmountOut;    // 순 출력 금액
    }
    
    struct RouteComparison {
        address router;
        string provider;
        CostBreakdown breakdown;
        bool isKRWDirect;
        uint256 savingsUsd;      // 절감액 (USD)
        uint256 savingsPercent;  // 절감 비율 (bps)
    }
    
    struct GasPriceData {
        uint256 gasPrice;        // 가스 가격 (wei)
        uint256 gasLimit;        // 가스 한도
        uint256 timestamp;       // 업데이트 시간
        bool isValid;
    }
    
    // ============ State Variables ============
    mapping(address => GasPriceData) public gasPrices;
    mapping(address => uint256) public tokenPricesUsd; // USD 기준 토큰 가격
    mapping(address => uint256) public tokenPricesKrw; // KRW 기준 토큰 가격
    
    address public usdOracle;    // USD 가격 오라클
    address public krwOracle;    // KRW 가격 오라클
    
    uint256 public gasPriceBufferBps = 1000; // 10% 가스 가격 버퍼
    uint256 public defaultSlippageBps = 50;  // 0.5% 기본 슬리피지
    
    // ============ Events ============
    event GasPriceUpdated(
        address indexed chain,
        uint256 gasPrice,
        uint256 gasLimit,
        uint256 timestamp
    );
    
    event TokenPriceUpdated(
        address indexed token,
        uint256 priceUsd,
        uint256 priceKrw,
        uint256 timestamp
    );
    
    event TTVCalculated(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 totalCostUsd,
        uint256 netAmountOut
    );
    
    // ============ Constructor ============
    constructor(address _usdOracle, address _krwOracle) {
        usdOracle = _usdOracle;
        krwOracle = _krwOracle;
    }
    
    // ============ Core Functions ============
    
    /**
     * @dev TTV 계산 (Total Trade Value)
     * @param tokenIn 입력 토큰
     * @param tokenOut 출력 토큰
     * @param amountIn 입력 금액
     * @param gasEstimate 가스 추정치
     * @param protocolFeeBps 프로토콜 수수료 (bps)
     * @param aggregatorFeeBps 애그리게이터 수수료 (bps)
     * @param lpFeeBps LP 수수료 (bps)
     * @param slippageBps 슬리피지 (bps)
     * @param serviceFeeBps 서비스 수수료 (bps)
     * @return breakdown 비용 분해
     */
    function calculateTTV(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 gasEstimate,
        uint256 protocolFeeBps,
        uint256 aggregatorFeeBps,
        uint256 lpFeeBps,
        uint256 slippageBps,
        uint256 serviceFeeBps
    ) external view returns (CostBreakdown memory breakdown) {
        
        // 1. 가스비 계산
        breakdown.gasCostUsd = _calculateGasCostUsd(gasEstimate);
        
        // 2. 프로토콜 수수료 계산
        breakdown.protocolFeeUsd = _calculateFeeUsd(amountIn, protocolFeeBps, tokenIn);
        
        // 3. 애그리게이터 수수료 계산
        breakdown.aggregatorFeeUsd = _calculateFeeUsd(amountIn, aggregatorFeeBps, tokenIn);
        
        // 4. LP 수수료 계산
        breakdown.lpFeeUsd = _calculateFeeUsd(amountIn, lpFeeBps, tokenIn);
        
        // 5. 슬리피지 비용 계산
        breakdown.slippageUsd = _calculateSlippageUsd(amountIn, slippageBps, tokenIn, tokenOut);
        
        // 6. 서비스 수수료 계산
        breakdown.serviceFeeUsd = _calculateFeeUsd(amountIn, serviceFeeBps, tokenIn);
        
        // 7. 총 비용 계산
        breakdown.totalCostUsd = breakdown.gasCostUsd + 
                                breakdown.protocolFeeUsd + 
                                breakdown.aggregatorFeeUsd + 
                                breakdown.lpFeeUsd + 
                                breakdown.slippageUsd + 
                                breakdown.serviceFeeUsd;
        
        // 8. 순 출력 금액 계산 (입력 금액 - 총 비용)
        uint256 amountInUsd = _convertToUsd(amountIn, tokenIn);
        breakdown.netAmountOut = amountInUsd - breakdown.totalCostUsd;
    }
    
    /**
     * @dev 라우트 비교 및 최적 라우트 선택
     * @param tokenIn 입력 토큰
     * @param tokenOut 출력 토큰
     * @param amountIn 입력 금액
     * @param routes 라우트 정보 배열
     * @return bestRoute 최적 라우트
     * @return comparisons 모든 라우트 비교 결과
     */
    function compareRoutes(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        RouteComparison[] memory routes
    ) external view returns (
        RouteComparison memory bestRoute,
        RouteComparison[] memory comparisons
    ) {
        require(routes.length > 0, "No routes provided");
        
        comparisons = new RouteComparison[](routes.length);
        uint256 bestTTV = type(uint256).max;
        uint256 bestIndex = 0;
        
        for (uint256 i = 0; i < routes.length; i++) {
            RouteComparison memory route = routes[i];
            
            // TTV 계산
            CostBreakdown memory breakdown = calculateTTV(
                tokenIn,
                tokenOut,
                amountIn,
                route.breakdown.gasCostUsd, // gasEstimate로 사용
                0, // protocolFeeBps
                0, // aggregatorFeeBps
                0, // lpFeeBps
                defaultSlippageBps,
                0  // serviceFeeBps
            );
            
            route.breakdown = breakdown;
            
            // 절감액 계산 (첫 번째 라우트를 기준으로)
            if (i == 0) {
                route.savingsUsd = 0;
                route.savingsPercent = 0;
            } else {
                uint256 savings = comparisons[0].breakdown.totalCostUsd - breakdown.totalCostUsd;
                route.savingsUsd = savings;
                route.savingsPercent = (savings * BPS_DENOMINATOR) / comparisons[0].breakdown.totalCostUsd;
            }
            
            comparisons[i] = route;
            
            // 최적 라우트 선택
            if (breakdown.totalCostUsd < bestTTV) {
                bestTTV = breakdown.totalCostUsd;
                bestIndex = i;
            }
        }
        
        bestRoute = comparisons[bestIndex];
    }
    
    /**
     * @dev KRW 스테이블코인 간 직접 스왑 vs USD 경유 스왑 비교
     * @param krwTokenIn KRW 입력 토큰
     * @param krwTokenOut KRW 출력 토큰
     * @param amountIn 입력 금액
     * @param usdRoute USD 경유 라우트 정보
     * @return isDirectBetter 직접 스왑이 더 나은지 여부
     * @return savingsUsd 절감액 (USD)
     * @return savingsPercent 절감 비율 (bps)
     */
    function compareKRWRoutes(
        address krwTokenIn,
        address krwTokenOut,
        uint256 amountIn,
        RouteComparison memory usdRoute
    ) external view returns (
        bool isDirectBetter,
        uint256 savingsUsd,
        uint256 savingsPercent
    ) {
        // KRW 직접 스왑 TTV 계산
        CostBreakdown memory directBreakdown = calculateTTV(
            krwTokenIn,
            krwTokenOut,
            amountIn,
            100000, // 가스 추정치
            0, 0, 0, defaultSlippageBps, 0
        );
        
        // USD 경유 스왑 TTV 계산
        CostBreakdown memory usdBreakdown = usdRoute.breakdown;
        
        // 비교
        if (directBreakdown.totalCostUsd < usdBreakdown.totalCostUsd) {
            isDirectBetter = true;
            savingsUsd = usdBreakdown.totalCostUsd - directBreakdown.totalCostUsd;
            savingsPercent = (savingsUsd * BPS_DENOMINATOR) / usdBreakdown.totalCostUsd;
        } else {
            isDirectBetter = false;
            savingsUsd = directBreakdown.totalCostUsd - usdBreakdown.totalCostUsd;
            savingsPercent = (savingsUsd * BPS_DENOMINATOR) / directBreakdown.totalCostUsd;
        }
    }
    
    // ============ Internal Functions ============
    
    /**
     * @dev 가스비 USD 환산
     */
    function _calculateGasCostUsd(uint256 gasEstimate) internal view returns (uint256) {
        // 실제 구현에서는 현재 가스 가격과 ETH/USD 가격을 사용
        // 여기서는 예시로 고정값 사용
        uint256 gasPrice = 20 gwei; // 20 gwei
        uint256 ethPriceUsd = 2000 * 1e6; // $2000 (6 decimals)
        
        uint256 gasCostWei = gasEstimate * gasPrice;
        uint256 gasCostEth = gasCostWei / 1e18;
        uint256 gasCostUsd = (gasCostEth * ethPriceUsd) / 1e18;
        
        // 가스 가격 버퍼 적용
        return gasCostUsd + (gasCostUsd * gasPriceBufferBps) / BPS_DENOMINATOR;
    }
    
    /**
     * @dev 수수료 USD 환산
     */
    function _calculateFeeUsd(
        uint256 amount,
        uint256 feeBps,
        address token
    ) internal view returns (uint256) {
        if (feeBps == 0) return 0;
        
        uint256 feeAmount = (amount * feeBps) / BPS_DENOMINATOR;
        return _convertToUsd(feeAmount, token);
    }
    
    /**
     * @dev 슬리피지 비용 USD 환산
     */
    function _calculateSlippageUsd(
        uint256 amountIn,
        uint256 slippageBps,
        address tokenIn,
        address tokenOut
    ) internal view returns (uint256) {
        if (slippageBps == 0) return 0;
        
        // 슬리피지는 출력 토큰 기준으로 계산
        uint256 slippageAmount = (amountIn * slippageBps) / BPS_DENOMINATOR;
        return _convertToUsd(slippageAmount, tokenOut);
    }
    
    /**
     * @dev 토큰 금액을 USD로 환산
     */
    function _convertToUsd(uint256 amount, address token) internal view returns (uint256) {
        uint256 tokenPriceUsd = tokenPricesUsd[token];
        if (tokenPriceUsd == 0) return 0;
        
        // 토큰 decimals에 따라 조정
        uint256 tokenDecimals = _getTokenDecimals(token);
        uint256 adjustedAmount = amount * 1e6 / (10 ** tokenDecimals); // USD decimals (6)로 조정
        
        return (adjustedAmount * tokenPriceUsd) / 1e6;
    }
    
    /**
     * @dev 토큰 decimals 조회
     */
    function _getTokenDecimals(address token) internal pure returns (uint256) {
        // 실제 구현에서는 ERC20 decimals() 함수 호출
        // 여기서는 예시로 고정값 사용
        if (token == address(0)) return 18; // ETH
        return 6; // USDC, USDT
    }
    
    // ============ Admin Functions ============
    
    /**
     * @dev 가스 가격 업데이트
     */
    function updateGasPrice(
        address chain,
        uint256 gasPrice,
        uint256 gasLimit
    ) external onlyOwner {
        gasPrices[chain] = GasPriceData({
            gasPrice: gasPrice,
            gasLimit: gasLimit,
            timestamp: block.timestamp,
            isValid: true
        });
        
        emit GasPriceUpdated(chain, gasPrice, gasLimit, block.timestamp);
    }
    
    /**
     * @dev 토큰 가격 업데이트
     */
    function updateTokenPrice(
        address token,
        uint256 priceUsd,
        uint256 priceKrw
    ) external onlyOwner {
        tokenPricesUsd[token] = priceUsd;
        tokenPricesKrw[token] = priceKrw;
        
        emit TokenPriceUpdated(token, priceUsd, priceKrw, block.timestamp);
    }
    
    /**
     * @dev 가스 가격 버퍼 설정
     */
    function setGasPriceBuffer(uint256 bufferBps) external onlyOwner {
        require(bufferBps <= 5000, "Buffer too high"); // 최대 50%
        gasPriceBufferBps = bufferBps;
    }
    
    /**
     * @dev 기본 슬리피지 설정
     */
    function setDefaultSlippage(uint256 slippageBps) external onlyOwner {
        require(slippageBps <= 1000, "Slippage too high"); // 최대 10%
        defaultSlippageBps = slippageBps;
    }
    
    /**
     * @dev 오라클 주소 업데이트
     */
    function updateOracles(address _usdOracle, address _krwOracle) external onlyOwner {
        usdOracle = _usdOracle;
        krwOracle = _krwOracle;
    }
    
    // ============ View Functions ============
    
    /**
     * @dev 현재 가스 가격 조회
     */
    function getGasPrice(address chain) external view returns (GasPriceData memory) {
        return gasPrices[chain];
    }
    
    /**
     * @dev 토큰 가격 조회
     */
    function getTokenPrice(address token) external view returns (uint256 priceUsd, uint256 priceKrw) {
        return (tokenPricesUsd[token], tokenPricesKrw[token]);
    }
    
    /**
     * @dev TTV 계산 결과 조회
     */
    function getTTVBreakdown(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (CostBreakdown memory) {
        return calculateTTV(
            tokenIn,
            tokenOut,
            amountIn,
            100000, // gasEstimate
            0, 0, 0, defaultSlippageBps, 0
        );
    }
}