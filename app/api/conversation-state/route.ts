// Conversation State API - Manages conversation context
import { NextRequest, NextResponse } from 'next/server';

// In-memory conversation store (in production, use Redis or a database)
declare global {
  // eslint-disable-next-line no-var
  var conversationStore: Map<string, {
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string; timestamp: Date }>;
    context: {
      scrapedUrls: string[];
      generatedFiles: string[];
      currentProject: string;
    };
    lastAccessed: Date;
    createdAt: Date;
  }>;
}

if (!global.conversationStore) {
  global.conversationStore = new Map();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, sessionId = 'default', message, context } = body;
    
    switch (action) {
      case 'add-message': {
        const session = global.conversationStore.get(sessionId) || {
          messages: [],
          context: { scrapedUrls: [], generatedFiles: [], currentProject: '' },
          lastAccessed: new Date(),
          createdAt: new Date()
        };
        
        if (message) {
          session.messages.push({
            ...message,
            timestamp: new Date()
          });
        }
        
        session.lastAccessed = new Date();
        global.conversationStore.set(sessionId, session);
        
        return NextResponse.json({
          success: true,
          messageCount: session.messages.length
        });
      }
      
      case 'get-context': {
        const session = global.conversationStore.get(sessionId);
        
        if (!session) {
          return NextResponse.json({
            success: true,
            messages: [],
            context: { scrapedUrls: [], generatedFiles: [], currentProject: '' }
          });
        }
        
        session.lastAccessed = new Date();
        
        return NextResponse.json({
          success: true,
          messages: session.messages.slice(-20), // Last 20 messages
          context: session.context
        });
      }
      
      case 'update-context': {
        const session = global.conversationStore.get(sessionId) || {
          messages: [],
          context: { scrapedUrls: [], generatedFiles: [], currentProject: '' },
          lastAccessed: new Date(),
          createdAt: new Date()
        };
        
        if (context) {
          session.context = { ...session.context, ...context };
        }
        
        session.lastAccessed = new Date();
        global.conversationStore.set(sessionId, session);
        
        return NextResponse.json({
          success: true,
          context: session.context
        });
      }
      
      case 'clear': {
        global.conversationStore.delete(sessionId);
        return NextResponse.json({
          success: true,
          message: 'Conversation cleared'
        });
      }
      
      case 'clear-old': {
        // Clear sessions older than 1 hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        let cleared = 0;
        
        for (const [id, session] of global.conversationStore.entries()) {
          if (session.lastAccessed < oneHourAgo) {
            global.conversationStore.delete(id);
            cleared++;
          }
        }
        
        return NextResponse.json({
          success: true,
          clearedSessions: cleared
        });
      }
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown action'
        }, { status: 400 });
    }
    
  } catch (error) {
    console.error('[conversation-state] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process request'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId') || 'default';
    
    const session = global.conversationStore.get(sessionId);
    
    if (!session) {
      return NextResponse.json({
        success: true,
        exists: false,
        messages: [],
        context: {}
      });
    }
    
    return NextResponse.json({
      success: true,
      exists: true,
      messages: session.messages.slice(-20),
      context: session.context,
      createdAt: session.createdAt,
      lastAccessed: session.lastAccessed
    });
    
  } catch (error) {
    console.error('[conversation-state] GET Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get conversation'
    }, { status: 500 });
  }
}
