import React from 'react';
import KRWSwapWidget from '@/components/KRWSwapWidget';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'xStables - KRW 스테이블코인 최적화 스왑',
  description: '가장 저렴한 총비용으로 KRW 스테이블코인을 교환하세요. 투명한 비용 구조와 실시간 디페그 보호를 제공합니다.',
  keywords: 'KRW 스테이블코인, 스왑, DeFi, 클레이튼, 원화, 스테이블코인 교환',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">xS</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">xStables</h1>
                <p className="text-xs text-gray-500">KRW 스테이블코인 특화</p>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                기능
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
                가격
              </a>
              <a href="#partners" className="text-gray-600 hover:text-gray-900 transition-colors">
                파트너
              </a>
              <a href="#docs" className="text-gray-600 hover:text-gray-900 transition-colors">
                문서
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                로그인
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                시작하기
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              🇰🇷 KRW 스테이블코인
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                최적화 스왑
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              가장 저렴한 총비용(TTV)으로 KRW 스테이블코인을 교환하세요.
              <br />
              투명한 비용 구조와 실시간 디페그 보호를 제공합니다.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                KRW 직접 스왑 최적화
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                실시간 디페그 감지
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                투명한 비용 구조
              </div>
            </div>
          </div>

          {/* Main Widget */}
          <div className="flex justify-center">
            <KRWSwapWidget />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              KRW 스테이블코인 특화 기능
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              한국 사용자를 위한 최적화된 스테이블코인 교환 경험
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl border border-gray-200 hover:border-blue-300 transition-colors">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🇰🇷</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                KRW 직접 스왑
              </h3>
              <p className="text-gray-600">
                KRW ↔ KRW 직접 경로와 USD 허브 경유를 자동 비교하여 
                가장 저렴한 경로를 선택합니다.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl border border-gray-200 hover:border-green-300 transition-colors">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                투명한 비용 구조
              </h3>
              <p className="text-gray-600">
                가스비, 수수료, 슬리피지를 항목별로 공개하여 
                실제 총비용(TTV)을 투명하게 표시합니다.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl border border-gray-200 hover:border-red-300 transition-colors">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                실시간 디페그 감지
              </h3>
              <p className="text-gray-600">
                KRW 스테이블코인의 페그 이탈을 실시간으로 감지하고 
                거래 전 경고를 제공합니다.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl border border-gray-200 hover:border-purple-300 transition-colors">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                클레이튼 네이티브
              </h3>
              <p className="text-gray-600">
                한국 블록체인 생태계인 클레이튼과 네이티브 연동하여 
                빠르고 저렴한 거래를 제공합니다.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl border border-gray-200 hover:border-yellow-300 transition-colors">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                절감액 표시
              </h3>
              <p className="text-gray-600">
                기존 방법 대비 절약된 금액을 실시간으로 계산하여 
                사용자에게 명확한 가치를 제공합니다.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl border border-gray-200 hover:border-indigo-300 transition-colors">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                100% 논커스터디얼
              </h3>
              <p className="text-gray-600">
                사용자 자금을 보관하지 않으며, 라우팅과 UX에만 집중하여 
                안전하고 신뢰할 수 있는 서비스를 제공합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              투명한 수수료 구조
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              사용자에게 가장 유리한 수수료 정책
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Basic Plan */}
            <div className="p-8 bg-white rounded-2xl border border-gray-200">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">기본</h3>
                <div className="text-4xl font-bold text-blue-600 mb-2">0.05%</div>
                <p className="text-gray-600">거래당 수수료</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-700">KRW 최적화 라우팅</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-700">투명한 비용 구조</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-700">디페그 보호</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-700">클레이튼 지원</span>
                </li>
              </ul>
              <button className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                시작하기
              </button>
            </div>

            {/* Pro Plan */}
            <div className="p-8 bg-white rounded-2xl border-2 border-blue-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  추천
                </span>
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">프로</h3>
                <div className="text-4xl font-bold text-blue-600 mb-2">0.03%</div>
                <p className="text-gray-600">볼륨 할인 적용</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-700">기본 기능 모두 포함</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-700">MEV 보호 ($0.5/거래)</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-700">가스리스 트랜잭션</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-700">우선 라우팅</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-700">고급 분석</span>
                </li>
              </ul>
              <button className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                프로 시작하기
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="p-8 bg-white rounded-2xl border border-gray-200">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">엔터프라이즈</h3>
                <div className="text-4xl font-bold text-blue-600 mb-2">맞춤형</div>
                <p className="text-gray-600">화이트라벨 솔루션</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-700">프로 기능 모두 포함</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-700">화이트라벨 위젯</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-700">SDK 통합</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-700">24/7 지원</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-700">수익 분배</span>
                </li>
              </ul>
              <button className="w-full py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors">
                문의하기
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section id="partners" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              파트너 프로그램
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              함께 성장하는 파트너십으로 더 많은 사용자에게 
              최적화된 스테이블코인 교환 경험을 제공하세요.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                파트너 혜택
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-sm">✓</span>
                  </span>
                  <div>
                    <h4 className="font-semibold text-gray-900">수익 분배</h4>
                    <p className="text-gray-600">거래 수수료의 30%를 파트너와 공유</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-sm">✓</span>
                  </span>
                  <div>
                    <h4 className="font-semibold text-gray-900">화이트라벨 위젯</h4>
                    <p className="text-gray-600">브랜드에 맞춤화된 스왑 위젯 제공</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-sm">✓</span>
                  </span>
                  <div>
                    <h4 className="font-semibold text-gray-900">상세 분석</h4>
                    <p className="text-gray-600">실시간 거래량 및 수익 분석 대시보드</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-sm">✓</span>
                  </span>
                  <div>
                    <h4 className="font-semibold text-gray-900">기술 지원</h4>
                    <p className="text-gray-600">SDK 통합 및 기술적 지원 제공</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-green-50 p-8 rounded-2xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                파트너 수익 예시
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                  <span className="text-gray-700">월 거래량</span>
                  <span className="font-semibold">$100,000</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                  <span className="text-gray-700">서비스 수수료 (0.05%)</span>
                  <span className="font-semibold">$50</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                  <span className="text-gray-700">파트너 수익 (30%)</span>
                  <span className="font-semibold text-green-600">$15</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white rounded-lg border-2 border-green-200">
                  <span className="text-gray-700 font-semibold">연간 예상 수익</span>
                  <span className="font-bold text-green-600 text-lg">$180</span>
                </div>
              </div>
              <button className="w-full mt-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                파트너 신청하기
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">xS</span>
                </div>
                <span className="text-xl font-bold">xStables</span>
              </div>
              <p className="text-gray-400 text-sm">
                KRW 스테이블코인 최적화 스왑 플랫폼
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">제품</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">스왑 위젯</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">SDK</a></li>
                <li><a href="#" className="hover:text-white transition-colors">화이트라벨</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">지원</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">문서</a></li>
                <li><a href="#" className="hover:text-white transition-colors">가이드</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API 레퍼런스</a></li>
                <li><a href="#" className="hover:text-white transition-colors">지원</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">회사</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">소개</a></li>
                <li><a href="#" className="hover:text-white transition-colors">블로그</a></li>
                <li><a href="#" className="hover:text-white transition-colors">채용</a></li>
                <li><a href="#" className="hover:text-white transition-colors">연락처</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 xStables. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}