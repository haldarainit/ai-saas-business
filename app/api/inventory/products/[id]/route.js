import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import { NextResponse } from 'next/server';

// GET /api/inventory/products/[id]
// Get a single product by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    await dbConnect();
    const product = await Product.findById(id);
    
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
// Update a product
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const updateData = await request.json();
    
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
    
    // Check if SKU is being updated to an existing one
    if (updateData.sku) {
      const existingProduct = await Product.findOne({ 
        _id: { $ne: id },
        sku: updateData.sku.trim() 
      });
      
      if (existingProduct) {
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
    
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
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
// Delete a product
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    await dbConnect();
    const deletedProduct = await Product.findByIdAndDelete(id);
    
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
