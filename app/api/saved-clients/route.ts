import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SavedClient from '@/models/SavedClient';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

// GET - Fetch all saved clients for the user
export async function GET(req: Request) {
    try {
        const { userId } = await getAuthenticatedUser(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';

        let query: any = { userId };
        if (search) {
            query.$or = [
                { company: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const clients = await SavedClient.find(query)
            .sort({ lastUsedAt: -1, usageCount: -1 })
            .limit(50);

        return NextResponse.json({ clients });
    } catch (error) {
        console.error('Error fetching saved clients:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST - Create or update a saved client
export async function POST(req: Request) {
    try {
        const { userId } = await getAuthenticatedUser(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await req.json();

        const { name, company, designation, address, phone, email, gstin, notes } = body;

        if (!company && !name) {
            return NextResponse.json({ error: 'Company name or contact name is required' }, { status: 400 });
        }

        // Check if client already exists (by company name + userId)
        const existingClient = await SavedClient.findOne({
            userId,
            company: { $regex: `^${(company || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
        });

        if (existingClient) {
            // Update existing client
            existingClient.name = name || existingClient.name;
            existingClient.designation = designation || existingClient.designation;
            existingClient.address = address || existingClient.address;
            existingClient.phone = phone || existingClient.phone;
            existingClient.email = email || existingClient.email;
            existingClient.gstin = gstin || existingClient.gstin;
            existingClient.notes = notes || existingClient.notes;
            existingClient.usageCount += 1;
            existingClient.lastUsedAt = new Date();
            await existingClient.save();
            return NextResponse.json({ client: existingClient, updated: true });
        }

        // Create new client
        const client = await SavedClient.create({
            userId,
            name: name || '',
            company: company || '',
            designation: designation || '',
            address: address || '',
            phone: phone || '',
            email: email || '',
            gstin: gstin || '',
            notes: notes || '',
            usageCount: 1,
            lastUsedAt: new Date()
        });

        return NextResponse.json({ client, created: true });
    } catch (error) {
        console.error('Error saving client:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE - Delete a saved client
export async function DELETE(req: Request) {
    try {
        const { userId } = await getAuthenticatedUser(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get('id');

        if (!clientId) {
            return NextResponse.json({ error: 'Client ID required' }, { status: 400 });
        }

        await SavedClient.deleteOne({ _id: clientId, userId });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting client:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
