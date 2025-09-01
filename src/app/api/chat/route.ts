// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { serverTimestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, message, customerEmail } = body;

    if (!sessionId || !message) {
      return NextResponse.json(
        { success: false, error: 'Session ID and message are required' },
        { status: 400 }
      );
    }

    // Simulate chatbot response (replace with actual AI service)
    const botResponse = simulateChatbotResponse(message);

    // Save chat interaction to Firestore
    const chatRef = adminDb.collection('chatInteractions').doc(sessionId);
    const chatDoc = await chatRef.get();

    const newMessage = {
      role: 'user',
      message,
      timestamp: new Date().toISOString(),
    };

    const botMessage = {
      role: 'bot',
      message: botResponse.message,
      timestamp: new Date().toISOString(),
      intent: botResponse.intent,
      confidence: botResponse.confidence,
    };

    if (chatDoc.exists) {
      await chatRef.update({
        messages: [...(chatDoc.data()?.messages || []), newMessage, botMessage],
        customerEmail: customerEmail || chatDoc.data()?.customerEmail,
        updatedAt: serverTimestamp(),
      });
    } else {
      await chatRef.set({
        sessionId,
        customerEmail,
        messages: [newMessage, botMessage],
        escalatedToSupport: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // Handle escalation if needed
    if (botResponse.needsEscalation && customerEmail) {
      const ticketNumber = `TKT-${Date.now().toString().slice(-8)}`;
      
      await adminDb.collection('tickets').add({
        clientEmail: customerEmail,
        channel: 'chatbot',
        subject: 'Chat escalation - Customer needs assistance',
        message: `Customer chat session escalated. Last message: "${message}"`,
        status: 'open',
        priority: 'normal',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update chat interaction to mark as escalated
      await chatRef.update({
        escalatedToSupport: true,
      });

      return NextResponse.json({
        success: true,
        message: `I've escalated your query to our support team. Your ticket number is ${ticketNumber}. Our team will contact you shortly.`,
        escalated: true,
        ticketNumber,
      });
    }

    return NextResponse.json({
      success: true,
      message: botResponse.message,
      escalated: false,
    });

  } catch (error) {
    console.error('Error handling chat:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

// Simulate chatbot response (replace with actual AI service)
function simulateChatbotResponse(message: string) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
    return {
      message: "I can help you with pricing information. Could you please provide the product SKU or name you're interested in?",
      intent: 'pricing_inquiry',
      confidence: 0.9,
      needsEscalation: false,
    };
  } else if (lowerMessage.includes('order') || lowerMessage.includes('purchase')) {
    return {
      message: "I can help you with order-related queries. Are you looking to place a new order or check an existing one?",
      intent: 'order_inquiry',
      confidence: 0.85,
      needsEscalation: false,
    };
  } else if (lowerMessage.includes('problem') || lowerMessage.includes('issue') || lowerMessage.includes('help')) {
    return {
      message: "I understand you're experiencing an issue. Let me connect you with our support team for personalized assistance.",
      intent: 'support_needed',
      confidence: 0.95,
      needsEscalation: true,
    };
  } else {
    return {
      message: "Thank you for your message. I'm here to help with product information, pricing, and orders. How can I assist you today?",
      intent: 'general',
      confidence: 0.7,
      needsEscalation: false,
    };
  }
}