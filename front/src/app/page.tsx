'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">xStables</h1>
            <p className="mt-2 text-sm text-gray-600">
              이미 로그인되어 있습니다
            </p>
          </div>
          <div className="space-y-4">
            <Link href="/dashboard">
              <Button className="w-full" size="lg">
                대시보드로 이동
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">xStables</h1>
            </div>
            <div className="space-x-4">
              <Link href="/login">
                <Button variant="outline">로그인</Button>
              </Link>
              <Link href="/register">
                <Button>회원가입</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            스테이블코인 발행의
            <span className="text-blue-600"> 새로운 표준</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            기업과 기관이 안전하고 효율적으로 자체 스테이블코인을 발행할 수 있도록 지원하는 종합 플랫폼입니다.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  지금 시작하기
                </Button>
              </Link>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  로그인
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 기능 소개 */}
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>원스톱 솔루션</CardTitle>
                <CardDescription>
                  법적 규제 분석부터 기술 구현, 운영 관리까지 전 과정 지원
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  복잡한 블록체인 기술을 비즈니스 친화적으로 단순화하여 전문 지식 없이도 스테이블코인 발행이 가능합니다.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>엔터프라이즈급 보안</CardTitle>
                <CardDescription>
                  멀티시그 지갑과 KYC/AML 자동화 시스템
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  다층 보안 구조와 실시간 모니터링을 통해 자산을 안전하게 보호합니다.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>멀티체인 지원</CardTitle>
                <CardDescription>
                  이더리움, BSC, 폴리곤 등 주요 체인 지원
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  다양한 블록체인 네트워크에서 스테이블코인을 발행하고 관리할 수 있습니다.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              © 2024 xStables. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
