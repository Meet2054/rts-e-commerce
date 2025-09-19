// import { NextRequest, NextResponse } from 'next/server';
// import { db } from '@/db';
// import { user } from '@/db/schema';

// export async function GET() {
//   try {
//     console.log('Testing database connection...');
    
//     // Try to fetch any user to test DB connection
//     const testUsers = await db.select().from(user).limit(1);
    
//     console.log('Database test result:', testUsers);
    
//     return NextResponse.json({
//       success: true,
//       message: 'Database connection successful',
//       userCount: testUsers.length,
//       sampleUser: testUsers[0] || null
//     });
    
//   } catch (error) {
//     console.error('Database test error:', error);
//     return NextResponse.json({
//       success: false,
//       error: 'Database connection failed',
//       details: error instanceof Error ? error.message : 'Unknown error'
//     }, { status: 500 });
//   }
// }
