'use client';

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">로그인이 필요합니다</h1>
          <p className="mt-2 text-gray-600">대시보드에 접근하려면 로그인해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">xStables</h1>
              <p className="text-sm text-gray-600">스테이블코인 발행 플랫폼</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                안녕하세요, {user.firstName || user.email}님
              </span>
              <Button variant="outline" onClick={logout}>
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 사용자 정보 카드 */}
            <Card>
              <CardHeader>
                <CardTitle>사용자 정보</CardTitle>
                <CardDescription>계정 기본 정보</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-500">이메일:</span>
                    <p className="text-sm text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">이름:</span>
                    <p className="text-sm text-gray-900">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : '미설정'
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">회사:</span>
                    <p className="text-sm text-gray-900">{user.company || '미설정'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">역할:</span>
                    <p className="text-sm text-gray-900">{user.role}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">상태:</span>
                    <p className="text-sm text-gray-900">{user.status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* KYC/AML 상태 카드 */}
            <Card>
              <CardHeader>
                <CardTitle>인증 상태</CardTitle>
                <CardDescription>KYC/AML 인증 현황</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">KYC 인증</span>
                    <span className={`text-sm font-medium ${
                      user.isKycVerified ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {user.isKycVerified ? '인증됨' : '미인증'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">AML 인증</span>
                    <span className={`text-sm font-medium ${
                      user.isAmlVerified ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {user.isAmlVerified ? '인증됨' : '미인증'}
                    </span>
                  </div>
                  <div className="pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      disabled={user.isKycVerified && user.isAmlVerified}
                    >
                      {user.isKycVerified && user.isAmlVerified 
                        ? '인증 완료' 
                        : '인증하기'
                      }
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 스테이블코인 현황 카드 */}
            <Card>
              <CardHeader>
                <CardTitle>스테이블코인</CardTitle>
                <CardDescription>발행 현황</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">0</div>
                  <p className="text-sm text-gray-600">발행된 스테이블코인</p>
                  <Button className="mt-4 w-full" size="sm">
                    새 스테이블코인 발행
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 최근 활동 */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>최근 활동</CardTitle>
                <CardDescription>계정 관련 최근 활동 내역</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-500">아직 활동 내역이 없습니다.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
