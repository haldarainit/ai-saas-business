import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

// GET /api/inventory/products/[id]
// Get a single product by ID for the authenticated user
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Get authenticated user
    const { userId } = await getAuthenticatedUser(request);
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    await dbConnect();
    // Find product that belongs to this user
    const product = await Product.findOne({ _id: id, userId });
    
    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { message: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT /api/inventory/products/[id]
// Update a product for the authenticated user
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const updateData = await request.json();
    
    // Get authenticated user
    const { userId } = await getAuthenticatedUser(request);
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Validate required fields - check for undefined/null/empty strings
    if (!updateData.name || updateData.name.trim() === '' || 
        !updateData.sku || updateData.sku.trim() === '' || 
        updateData.price === undefined || updateData.price === null || updateData.price === '' || 
        updateData.cost === undefined || updateData.cost === null || updateData.cost === '' || 
        updateData.quantity === undefined || updateData.quantity === null || updateData.quantity === '') {
      return NextResponse.json(
        { message: 'Required fields (name, sku, price, cost, quantity) cannot be empty' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    // First verify the product belongs to this user
    const existingProduct = await Product.findOne({ _id: id, userId });
    if (!existingProduct) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Check if SKU is being updated to an existing one (for this user)
    if (updateData.sku) {
      const duplicateProduct = await Product.findOne({ 
        _id: { $ne: id },
        userId: userId,
        sku: updateData.sku.trim() 
      });
      
      if (duplicateProduct) {
        return NextResponse.json(
          { message: 'A product with this SKU already exists' },
          { status: 400 }
        );
      }
    }
    
    // Prepare update data with proper types
    const updatePayload = {
      name: updateData.name.trim(),
      sku: updateData.sku.trim(),
      description: updateData.description || '',
      category: updateData.category || 'Uncategorized',
      price: parseFloat(updateData.price),
      cost: parseFloat(updateData.cost || 0),
      quantity: parseInt(updateData.quantity, 10),
      shelf: updateData.shelf || 'Default',
      expiryDate: updateData.expiryDate ? new Date(updateData.expiryDate) : null,
      supplier: updateData.supplier || '',
      updatedAt: new Date()
    };
    
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: id, userId },
      updatePayload,
      { new: true, runValidators: true }
    );
    
    if (!updatedProduct) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { message: 'Validation failed', errors: validationErrors },
        { status: 400 }
      );
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { message: 'A product with this SKU already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Failed to update product: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory/products/[id]
// Delete a product for the authenticated user
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Get authenticated user
    const { userId } = await getAuthenticatedUser(request);
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    await dbConnect();
    // Only delete if product belongs to this user
    const deletedProduct = await Product.findOneAndDelete({ _id: id, userId });
    
    if (!deletedProduct) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { message: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
