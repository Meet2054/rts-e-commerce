import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { RedisCache } from '@/lib/redis-cache';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  console.log(`🔍 [API:USER] GET request for user ID: ${params.id}`);
  console.log(`🔍 [API:USER] Request URL: ${request.url}`);
  console.log(`🔍 [API:USER] Request method: ${request.method}`);
  console.log(`🔍 [API:USER] Request headers:`, Object.fromEntries([...request.headers.entries()]));
  
  try {
    // Check for authorization header
    const authHeader = request.headers.get('authorization');
    console.log(`🔑 [API:USER] Auth header present: ${!!authHeader}`);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error(`❌ [API:USER] Authentication missing for user ID: ${params.id}`);
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    console.log(`🔑 [API:USER] Token extracted: ${!!token} (length: ${token ? token.length : 0})`);
    
    if (!token) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }
    
    // For development/testing, allow dummy tokens to bypass auth
    const isDummyToken = token === 'dummy-token-for-testing';
    console.log(`🔑 [API:USER] Using dummy token: ${isDummyToken}`);
    
    if (!isDummyToken) {
      try {
        // Verify the token with Firebase Admin
        const decodedToken = await getAuth().verifyIdToken(token);
        console.log(`✅ [API:USER] Token verified for user: ${decodedToken.uid}`);
        
        // Check if user has admin role
        const adminDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
        if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
          console.error(`❌ [API:USER] Admin access required for user: ${decodedToken.uid}`);
          return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }
      } catch (authError) {
        console.error('❌ [API:USER] Auth error:', authError);
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
      }
    } else {
      console.log(`🔧 [API:USER] Bypassing auth check for dummy token`);
    }

    const userId = params.id;
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    console.log(`🔍 [API:USER] User ID format validation: length=${userId.length}, pattern=${/^[A-Za-z0-9_-]+$/.test(userId) ? 'valid' : 'invalid'}`);
    
    // Check if this is a test or malformed user ID
    if (userId === 'undefined' || userId === 'null' || userId.includes(' ') || userId.length < 5) {
      console.warn(`⚠️ [API:USER] Potentially invalid user ID received: "${userId}"`);
    }
    
    // Check if the request needs to bypass cache
    let bypassCache = request.headers.get('Cache-Control') === 'no-cache';
    let userDocData: any = null;
    let dataSource = 'unknown';
    
    // Try to get data from Redis cache first unless bypass is requested
    if (!bypassCache) {
      console.log(`🔍 [API:USER] Checking Redis cache for user ${userId}`);
      try {
        const cachedUserData = await RedisCache.get(`user:${userId}`, 'admin');
        
        if (cachedUserData) {
          console.log(`✅ [API:USER] Cache HIT - Using Redis data for user ${userId}`);
          console.log(`📦 [API:USER] Redis data:`, JSON.stringify({
            keyCount: Object.keys(cachedUserData).length,
            hasID: !!cachedUserData.id,
            hasName: !!cachedUserData.displayName || !!cachedUserData.name,
            hasEmail: !!cachedUserData.email
          }));
          
          // Check for Redis data integrity
          const hasCriticalFields = 
            cachedUserData.id && 
            (cachedUserData.displayName || cachedUserData.name) && 
            cachedUserData.email;
            
          if (!hasCriticalFields) {
            console.warn(`⚠️ [API:USER] Redis cached data is missing critical fields, possible versioning issue`);
            console.log(`⚠️ [API:USER] Redis data inspection:`, JSON.stringify(cachedUserData));
            
            // Force cache bypass due to data issues
            bypassCache = true;
          } else {
            // Use the cached data if it has all critical fields
            userDocData = cachedUserData;
            dataSource = 'redis';
          }
        } else {
          console.log(`❌ [API:USER] Cache MISS - Redis data not found for user ${userId}`);
        }
      } catch (redisError) {
        console.error(`❌ [API:USER] Redis error:`, redisError);
        console.log(`🔄 [API:USER] Falling back to Firestore due to Redis error`);
      }
    } else {
      console.log(`🚫 [API:USER] Cache bypassed for user ${userId} due to no-cache header`);
    }
    
    // If no cached data, fetch from Firestore
    if (!userDocData) {
      console.log(`🔥 [API:USER] Fetching from Firestore for user ${userId}`);
      try {
        const userDocRef = adminDb.collection('users').doc(userId);
        console.log(`🔥 [API:USER] Firestore document path: ${userDocRef.path}`);
        
        const userDoc = await userDocRef.get();
        
        console.log(`🔥 [API:USER] Firestore document exists: ${userDoc.exists}`);
        
        if (!userDoc.exists) {
          console.error(`❌ [API:USER] User not found in Firestore: ${userId}`);
          
          // For testing purposes, if this is a dummy token, create mock data
          if (isDummyToken && userId.startsWith('test-')) {
            console.log(`🔧 [API:USER] Creating mock data for test user: ${userId}`);
            userDocData = {
              id: userId,
              displayName: 'Test User',
              name: 'Test User',
              email: 'test@example.com',
              phoneNumber: '+1234567890',
              phone: '+1234567890',
              companyName: 'Test Company',
              roleInCompany: 'Developer',
              address: '123 Test Street',
              addressLine1: '123 Test Street',
              city: 'Test City',
              state: 'Test State',
              zipCode: '12345',
              postalCode: '12345',
              country: 'Test Country',
              agreedToTerms: true,
              status: 'requested',
              createdAt: new Date().toISOString()
            };
            dataSource = 'mock';
          } else {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
          }
        } else {
          userDocData = userDoc.data();
          console.log(`🔥 [API:USER] Firestore data received:`, userDocData ? JSON.stringify(userDocData, null, 2) : 'null');
          
          if (!userDocData) {
            console.error(`❌ [API:USER] User document exists but data is null for ${userId}`);
          } else {
            // Validate critical fields are present
            const missingFields = [];
            const requiredFields = ['displayName', 'email'];
            
            for (const field of requiredFields) {
              if (!userDocData[field] && (field !== 'displayName' || !userDocData.name)) {
                missingFields.push(field);
              }
            }
            
            if (missingFields.length > 0) {
              console.warn(`⚠️ [API:USER] User document is missing fields: ${missingFields.join(', ')}`);
            }
            
            console.log(`🔎 [API:USER] Document field validation complete. Fields present: ${Object.keys(userDocData).join(', ')}`);
          }
          
          dataSource = 'firestore';
          
          // Cache the fresh data for future use
          if (userDocData) {
            console.log(`💾 [API:USER] Saving user ${userId} data to Redis cache (size: ${JSON.stringify(userDocData).length} bytes)`);
            try {
              await RedisCache.set(`user:${userId}`, userDocData, { 
                prefix: 'admin', 
                ttl: 300 // Cache for 5 minutes
              });
              console.log(`✅ [API:USER] Successfully cached to Redis`);
            } catch (cacheError) {
              console.error(`❌ [API:USER] Error caching to Redis:`, cacheError);
              // Continue even if caching fails
            }
          } else {
            console.error(`❌ [API:USER] No data returned from Firestore for existing document`);
          }
        }
      } catch (firestoreError) {
        console.error(`❌ [API:USER] Firestore error:`, firestoreError);
        return NextResponse.json({ 
          error: 'Database error', 
          details: firestoreError instanceof Error ? firestoreError.message : 'Unknown error'
        }, { status: 500 });
      }
    }
    
    // Process the data for response
    console.log(`🔄 [API:USER] Processing raw user data to create response:`, {
      sourceType: dataSource,
      hasRawData: !!userDocData,
      rawDataFields: userDocData ? Object.keys(userDocData) : []
    });
    
    // Extract values with fallbacks and debug logging
    const extractField = (primaryKey: string, fallbackKey: string, defaultValue: string) => {
      const value = userDocData?.[primaryKey] || userDocData?.[fallbackKey] || defaultValue;
      if (!userDocData?.[primaryKey] && !userDocData?.[fallbackKey]) {
        console.warn(`⚠️ [API:USER] Field "${primaryKey}" (fallback: "${fallbackKey}") is missing, using default: "${defaultValue}"`);
      }
      return value;
    };
    
    const userData = {
      id: userId, // Use the userId parameter instead of userDoc.id
      displayName: extractField('displayName', 'name', 'Unknown'),
      email: extractField('email', '', 'No email provided'),
      phoneNumber: extractField('phoneNumber', 'phone', 'Not provided'),
      roleInCompany: extractField('roleInCompany', '', 'Not provided'),
      companyName: extractField('companyName', '', 'Not provided'),
      address: extractField('address', 'addressLine1', 'Not provided'),
      city: extractField('city', '', 'Not provided'),
      state: extractField('state', '', 'Not provided'),
      zipCode: extractField('zipCode', 'postalCode', 'Not provided'),
      country: extractField('country', '', 'Not provided'),
      agreedToTerms: userDocData?.agreedToTerms || false,
      createdAt: userDocData?.createdAt || null,
      status: extractField('status', '', 'requested'),
      ...userDocData // Include any other fields that might exist
    };
    
    console.log(`✅ [API:USER] Final user data fields populated:`, Object.keys(userData));

    // Prepare the response
    const responseData = {
      user: userData,
      meta: {
        timestamp: new Date().toISOString(),
        source: dataSource,
        cacheStatus: bypassCache ? 'bypassed' : (dataSource === 'redis' ? 'hit' : 'miss'),
        fieldsReceived: Object.keys(userDocData || {}),
        fieldsReturned: Object.keys(userData)
      }
    };
    
    console.log(`✅ [API:USER] Sending response:`, JSON.stringify({
      ...responseData,
      user: {
        id: responseData.user.id,
        displayName: responseData.user.displayName,
        // Only log partial user data for privacy reasons
        fieldsPresent: Object.keys(responseData.user).length,
        hasEmail: !!responseData.user.email,
        hasPhone: !!responseData.user.phoneNumber
      }
    }, null, 2));
    
    // Special debugging - log the full raw response data (without obfuscation) to find issues
    console.log(`🔍 [API:USER] FULL RESPONSE DATA (debugging):`, JSON.stringify({
      meta: responseData.meta,
      userFields: Object.keys(responseData.user),
      user: {
        id: responseData.user.id,
        displayName: responseData.user.displayName,
        email: responseData.user.email,
        phoneNumber: responseData.user.phoneNumber,
        address: responseData.user.address,
        city: responseData.user.city,
        state: responseData.user.state,
        zipCode: responseData.user.zipCode,
        country: responseData.user.country,
        roleInCompany: responseData.user.roleInCompany,
        companyName: responseData.user.companyName
      }
    }, null, 2));
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data', details: (error as Error).message },
      { status: 500 }
    );
  }
}