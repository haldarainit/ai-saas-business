const mongoose = require('mongoose');

// Cache the model to prevent multiple compilations
let SalesScriptHistory;

const getModel = () => {
  if (!SalesScriptHistory) {
    SalesScriptHistory = require('../../../lib/models/SalesScriptHistory');
  }
  return SalesScriptHistory;
};

// MongoDB connection function
const connectDB = async () => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-saas-business');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }
};

export async function GET(request) {
  try {
    await connectDB();
    const SalesScriptHistoryModel = getModel();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'user_123'; // Default user ID
    const limit = parseInt(searchParams.get('limit')) || 10;
    const page = parseInt(searchParams.get('page')) || 1;

    const scripts = await SalesScriptHistoryModel.find({ 
      userId, 
      isActive: true 
    })
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .select('script formData timestamp version label')
    .lean();

    const total = await SalesScriptHistoryModel.countDocuments({ 
      userId, 
      isActive: true 
    });

    return Response.json({
      success: true,
      scripts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching sales script history:', error);
    return Response.json({
      success: false,
      error: 'Failed to fetch history'
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const SalesScriptHistoryModel = getModel();
    
    const { userId, script, formData, label } = await request.json();

    if (!script || !formData) {
      return Response.json({
        success: false,
        error: 'Script and form data are required'
      }, { status: 400 });
    }

    const nextVersion = await SalesScriptHistoryModel.getNextVersion(userId || 'user_123');

    const newScript = new SalesScriptHistoryModel({
      userId: userId || 'user_123',
      script,
      formData,
      label: label || 'Generated Script',
      version: nextVersion
    });

    await newScript.save();

    return Response.json({
      success: true,
      script: newScript
    });
  } catch (error) {
    console.error('Error saving sales script:', error);
    return Response.json({
      success: false,
      error: 'Failed to save script'
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const SalesScriptHistoryModel = getModel();
    
    const { searchParams } = new URL(request.url);
    const scriptId = searchParams.get('scriptId');

    if (!scriptId) {
      return Response.json({
        success: false,
        error: 'Script ID is required'
      }, { status: 400 });
    }

    await SalesScriptHistoryModel.findByIdAndUpdate(scriptId, { isActive: false });

    return Response.json({
      success: true,
      message: 'Script deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sales script:', error);
    return Response.json({
      success: false,
      error: 'Failed to delete script'
    }, { status: 500 });
  }
}
