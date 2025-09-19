// import { NextRequest, NextResponse } from 'next/server';
// import { db } from '@/db';
// import { user } from '@/db/schema';
// import { eq } from 'drizzle-orm';

// export async function POST(request: NextRequest) {
//   try {
//     const { email, name } = await request.json();
    
//     if (!email || !name) {
//       return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
//     }

//     // Check if user already exists
//     const existingUser = await db.select().from(user).where(eq(user.email, email)).limit(1);
    
//     if (existingUser.length > 0) {
//       // Update existing user to admin
//       await db.update(user)
//         .set({ role: 'admin' })
//         .where(eq(user.email, email));
      
//       return NextResponse.json({
//         success: true,
//         message: 'User updated to admin',
//         user: existingUser[0]
//       });
//     } else {
//       // Create new admin user
//       const newUser = {
//         id: crypto.randomUUID(),
//         name,
//         email,
//         role: 'admin',
//         emailVerified: true
//       };

//       await db.insert(user).values(newUser);

//       return NextResponse.json({
//         success: true,
//         message: 'Admin user created',
//         user: newUser
//       });
//     }

//   } catch (error) {
//     console.error('Error creating admin:', error);
//     return NextResponse.json({
//       success: false,
//       error: 'Failed to create admin user',
//       details: error instanceof Error ? error.message : 'Unknown error'
//     }, { status: 500 });
//   }
// }
