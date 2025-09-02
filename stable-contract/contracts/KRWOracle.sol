// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title KRWOracle
 * @dev KRW 페그 스테이블코인 전용 오라클 - 실시간 디페그 감지 및 가격 피드
 * @author xStables Team
 */
contract KRWOracle is Ownable, Pausable {
    
    // ============ Constants ============
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant MAX_DEVIATION_BPS = 1000; // 10%
    uint256 public constant PRICE_UPDATE_INTERVAL = 300; // 5분
    
    // ============ Structs ============
    struct PriceData {
        uint256 price; // KRW 기준 가격 (18 decimals)
        uint256 timestamp;
        uint256 confidence; // 신뢰도 (0-100)
        bool isValid;
    }
    
    struct KRWStableConfig {
        address token;
        string symbol;
        uint256 targetPegPrice; // 목표 페그 가격 (예: 1 KRW = 1e18)
        uint256 depegThresholdBps; // 디페그 임계값 (50 = 0.5%)
        bool isActive;
        uint256 lastUpdateTime;
    }
    
    // ============ State Variables ============
    mapping(address => PriceData) public prices;
    mapping(address => KRWStableConfig) public krwStables;
    mapping(address => bool) public authorizedUpdaters;
    
    address[] public supportedTokens;
    uint256 public updateInterval = PRICE_UPDATE_INTERVAL;
    
    // ============ Events ============
    event PriceUpdated(
        address indexed token,
        uint256 price,
        uint256 timestamp,
        uint256 confidence
    );
    
    event KRWStableRegistered(
        address indexed token,
        string symbol,
        uint256 targetPegPrice,
        uint256 depegThresholdBps
    );
    
    event DepegAlert(
        address indexed token,
        uint256 currentPrice,
        uint256 targetPegPrice,
        uint256 deviationBps,
        uint256 severity // 1: 경고, 2: 위험, 3: 심각
    );
    
    event UpdaterAuthorized(address indexed updater, bool authorized);
    event UpdateIntervalChanged(uint256 newInterval);
    
    // ============ Modifiers ============
    modifier onlyAuthorizedUpdater() {
        require(authorizedUpdaters[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    modifier onlyActiveToken(address token) {
        require(krwStables[token].isActive, "Token not active");
        _;
    }
    
    // ============ Constructor ============
    constructor() {
        // 기본 KRW 페그 가격 설정 (1 KRW = 1e18)
        // 실제로는 USD/KRW 환율을 기준으로 설정
    }
    
    // ============ Core Functions ============
    
    /**
     * @dev KRW 스테이블코인 가격 업데이트
     * @param token 토큰 주소
     * @param price KRW 기준 가격 (18 decimals)
     * @param confidence 신뢰도 (0-100)
     */
    function updatePrice(
        address token,
        uint256 price,
        uint256 confidence
    ) external onlyAuthorizedUpdater onlyActiveToken(token) {
        require(price > 0, "Invalid price");
        require(confidence <= 100, "Invalid confidence");
        
        KRWStableConfig memory config = krwStables[token];
        
        // 업데이트 간격 체크
        require(
            block.timestamp >= config.lastUpdateTime + updateInterval,
            "Update too frequent"
        );
        
        // 가격 데이터 업데이트
        prices[token] = PriceData({
            price: price,
            timestamp: block.timestamp,
            confidence: confidence,
            isValid: true
        });
        
        // KRW 스테이블 설정 업데이트
        krwStables[token].lastUpdateTime = block.timestamp;
        
        emit PriceUpdated(token, price, block.timestamp, confidence);
        
        // 디페그 체크
        _checkDepeg(token, price, config.targetPegPrice, config.depegThresholdBps);
    }
    
    /**
     * @dev 여러 토큰 가격 일괄 업데이트
     */
    function updatePricesBatch(
        address[] calldata tokens,
        uint256[] calldata prices,
        uint256[] calldata confidences
    ) external onlyAuthorizedUpdater {
        require(
            tokens.length == prices.length && prices.length == confidences.length,
            "Array length mismatch"
        );
        
        for (uint256 i = 0; i < tokens.length; i++) {
            if (krwStables[tokens[i]].isActive) {
                _updatePriceInternal(tokens[i], prices[i], confidences[i]);
            }
        }
    }
    
    // ============ Internal Functions ============
    
    /**
     * @dev 내부 가격 업데이트 함수
     */
    function _updatePriceInternal(
        address token,
        uint256 price,
        uint256 confidence
    ) internal {
        require(price > 0, "Invalid price");
        require(confidence <= 100, "Invalid confidence");
        
        KRWStableConfig memory config = krwStables[token];
        
        // 업데이트 간격 체크
        if (block.timestamp < config.lastUpdateTime + updateInterval) {
            return; // 너무 빈번한 업데이트는 무시
        }
        
        // 가격 데이터 업데이트
        prices[token] = PriceData({
            price: price,
            timestamp: block.timestamp,
            confidence: confidence,
            isValid: true
        });
        
        // KRW 스테이블 설정 업데이트
        krwStables[token].lastUpdateTime = block.timestamp;
        
        emit PriceUpdated(token, price, block.timestamp, confidence);
        
        // 디페그 체크
        _checkDepeg(token, price, config.targetPegPrice, config.depegThresholdBps);
    }
    
    /**
     * @dev 디페그 감지 및 알림
     */
    function _checkDepeg(
        address token,
        uint256 currentPrice,
        uint256 targetPegPrice,
        uint256 depegThresholdBps
    ) internal {
        uint256 deviationBps = _calculateDeviationBps(currentPrice, targetPegPrice);
        
        if (deviationBps > depegThresholdBps) {
            uint256 severity = _calculateSeverity(deviationBps, depegThresholdBps);
            
            emit DepegAlert(
                token,
                currentPrice,
                targetPegPrice,
                deviationBps,
                severity
            );
        }
    }
    
    /**
     * @dev 가격 편차 계산 (bps)
     */
    function _calculateDeviationBps(
        uint256 currentPrice,
        uint256 targetPrice
    ) internal pure returns (uint256) {
        if (currentPrice >= targetPrice) {
            return ((currentPrice - targetPrice) * BPS_DENOMINATOR) / targetPrice;
        } else {
            return ((targetPrice - currentPrice) * BPS_DENOMINATOR) / targetPrice;
        }
    }
    
    /**
     * @dev 심각도 계산
     */
    function _calculateSeverity(
        uint256 deviationBps,
        uint256 thresholdBps
    ) internal pure returns (uint256) {
        if (deviationBps <= thresholdBps * 2) {
            return 1; // 경고
        } else if (deviationBps <= thresholdBps * 5) {
            return 2; // 위험
        } else {
            return 3; // 심각
        }
    }
    
    // ============ Admin Functions ============
    
    /**
     * @dev KRW 스테이블코인 등록
     */
    function registerKRWStable(
        address token,
        string calldata symbol,
        uint256 targetPegPrice,
        uint256 depegThresholdBps
    ) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(depegThresholdBps <= MAX_DEVIATION_BPS, "Threshold too high");
        require(targetPegPrice > 0, "Invalid peg price");
        
        krwStables[token] = KRWStableConfig({
            token: token,
            symbol: symbol,
            targetPegPrice: targetPegPrice,
            depegThresholdBps: depegThresholdBps,
            isActive: true,
            lastUpdateTime: 0
        });
        
        // 지원 토큰 목록에 추가 (중복 체크)
        bool exists = false;
        for (uint256 i = 0; i < supportedTokens.length; i++) {
            if (supportedTokens[i] == token) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            supportedTokens.push(token);
        }
        
        emit KRWStableRegistered(token, symbol, targetPegPrice, depegThresholdBps);
    }
    
    /**
     * @dev KRW 스테이블코인 비활성화
     */
    function deactivateKRWStable(address token) external onlyOwner {
        require(krwStables[token].isActive, "Token not active");
        krwStables[token].isActive = false;
    }
    
    /**
     * @dev KRW 스테이블코인 재활성화
     */
    function activateKRWStable(address token) external onlyOwner {
        require(!krwStables[token].isActive, "Token already active");
        krwStables[token].isActive = true;
    }
    
    /**
     * @dev 디페그 임계값 업데이트
     */
    function updateDepegThreshold(
        address token,
        uint256 newThresholdBps
    ) external onlyOwner {
        require(newThresholdBps <= MAX_DEVIATION_BPS, "Threshold too high");
        krwStables[token].depegThresholdBps = newThresholdBps;
    }
    
    /**
     * @dev 목표 페그 가격 업데이트
     */
    function updateTargetPegPrice(
        address token,
        uint256 newPegPrice
    ) external onlyOwner {
        require(newPegPrice > 0, "Invalid peg price");
        krwStables[token].targetPegPrice = newPegPrice;
    }
    
    /**
     * @dev 가격 업데이터 권한 관리
     */
    function setUpdaterAuthorization(
        address updater,
        bool authorized
    ) external onlyOwner {
        authorizedUpdaters[updater] = authorized;
        emit UpdaterAuthorized(updater, authorized);
    }
    
    /**
     * @dev 업데이트 간격 변경
     */
    function setUpdateInterval(uint256 newInterval) external onlyOwner {
        require(newInterval >= 60, "Interval too short"); // 최소 1분
        updateInterval = newInterval;
        emit UpdateIntervalChanged(newInterval);
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
     * @dev 현재 가격 조회
     */
    function getPrice(address token) external view returns (PriceData memory) {
        return prices[token];
    }
    
    /**
     * @dev KRW 스테이블코인 설정 조회
     */
    function getKRWStableConfig(address token) external view returns (KRWStableConfig memory) {
        return krwStables[token];
    }
    
    /**
     * @dev 디페그 상태 체크
     */
    function checkDepegStatus(address token) external view returns (
        bool isDepegged,
        uint256 deviationBps,
        uint256 severity
    ) {
        KRWStableConfig memory config = krwStables[token];
        if (!config.isActive) {
            return (false, 0, 0);
        }
        
        PriceData memory priceData = prices[token];
        if (!priceData.isValid) {
            return (false, 0, 0);
        }
        
        uint256 deviation = _calculateDeviationBps(priceData.price, config.targetPegPrice);
        bool depegged = deviation > config.depegThresholdBps;
        
        if (depegged) {
            severity = _calculateSeverity(deviation, config.depegThresholdBps);
        }
        
        return (depegged, deviation, severity);
    }
    
    /**
     * @dev 지원되는 토큰 목록 조회
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokens;
    }
    
    /**
     * @dev 활성 토큰 수 조회
     */
    function getActiveTokenCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < supportedTokens.length; i++) {
            if (krwStables[supportedTokens[i]].isActive) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * @dev 가격 신뢰도 체크
     */
    function isPriceReliable(address token) external view returns (bool) {
        PriceData memory priceData = prices[token];
        return priceData.isValid && 
               priceData.confidence >= 80 && 
               block.timestamp <= priceData.timestamp + 3600; // 1시간 이내
    }
    
    /**
     * @dev USD/KRW 환율 기반 페그 가격 계산
     * @param usdKrwRate USD/KRW 환율 (예: 1300 = 1 USD = 1300 KRW)
     * @return krwPegPrice KRW 기준 페그 가격 (18 decimals)
     */
    function calculateKRWPegPrice(uint256 usdKrwRate) external pure returns (uint256 krwPegPrice) {
        // 1 USD = usdKrwRate KRW
        // 1 USD 스테이블코인 = usdKrwRate * 1e18 KRW
        return usdKrwRate * 1e18;
    }
}