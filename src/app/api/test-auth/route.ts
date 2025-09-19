import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing auth...');
    
    const currentUser = await getCurrentUser(request);
    
    console.log('Auth test result:', currentUser);
    
    return NextResponse.json({
      success: true,
      message: 'Auth test completed',
      user: currentUser,
      hasAuth: !!currentUser,
      isAdmin: currentUser?.role === 'admin'
    });
    
  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Auth test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
