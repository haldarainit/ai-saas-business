import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SavedTermsCondition from '@/models/SavedTermsCondition';
import { getAuthenticatedUser } from '@/lib/get-auth-user';

// System presets that are always available
const SYSTEM_PRESETS = [
    {
        label: 'Standard Terms & Conditions',
        category: 'general',
        terms: [
            'Prices are valid for 30 days from the date of this quotation.',
            'Payment: 50% advance with order, 50% before dispatch.',
            'Delivery: 4-6 weeks from receipt of confirmed purchase order and advance payment.',
            'GST/Taxes: As applicable, extra at actuals.',
            'Freight & Insurance: Extra at actuals / included in the quoted price.',
            'Warranty: 12 months from date of supply against manufacturing defects.',
            'Force Majeure: Delivery subject to force majeure conditions.',
            'Jurisdiction: All disputes subject to local court jurisdiction.'
        ]
    },
    {
        label: 'Payment - 100% Advance',
        category: 'payment',
        terms: [
            'Payment: 100% advance along with purchase order.',
            'No credit terms applicable.',
            'GST/Taxes: As applicable, extra at actuals.',
            'Prices valid for 15 days from date of quotation.'
        ]
    },
    {
        label: 'Payment - 30/70 Split',
        category: 'payment',
        terms: [
            'Payment: 30% advance with purchase order.',
            '70% balance payment before dispatch / on delivery.',
            'GST/Taxes: As applicable, extra at actuals.',
            'Prices valid for 30 days from date of quotation.'
        ]
    },
    {
        label: 'Payment - 50/50 Split',
        category: 'payment',
        terms: [
            'Payment: 50% advance with purchase order.',
            '50% balance payment before dispatch.',
            'GST/Taxes: As applicable, extra at actuals.',
            'Prices valid for 30 days from date of quotation.'
        ]
    },
    {
        label: 'Payment - LC / Letter of Credit',
        category: 'payment',
        terms: [
            'Payment: Through irrevocable Letter of Credit (LC) at sight.',
            'LC to be opened within 15 days of order confirmation.',
            'All LC charges on buyer\'s account.',
            'GST/Taxes: As applicable, extra at actuals.'
        ]
    },
    {
        label: 'Delivery - Ex-Works',
        category: 'delivery',
        terms: [
            'Delivery: Ex-Works from our facility.',
            'Freight, insurance & transport charges: Extra, at buyer\'s account.',
            'Delivery period: 4-6 weeks from receipt of confirmed PO and advance.',
            'Packing: Standard export-worthy packing included.'
        ]
    },
    {
        label: 'Delivery - Door Delivery',
        category: 'delivery',
        terms: [
            'Delivery: Door delivery at buyer\'s site (within India).',
            'Freight & insurance charges: Included in quoted price.',
            'Delivery period: 4-6 weeks from receipt of confirmed PO and advance.',
            'Unloading at site: Buyer\'s scope and responsibility.'
        ]
    },
    {
        label: 'Warranty - 12 Months',
        category: 'warranty',
        terms: [
            'Warranty: 12 months from date of commissioning or 18 months from dispatch, whichever is earlier.',
            'Warranty covers manufacturing defects only.',
            'Consumables and wear parts are not covered under warranty.',
            'On-site service charges during warranty: Free (travel & stay extra).',
            'Warranty void if equipment is mishandled or operated by untrained personnel.'
        ]
    },
    {
        label: 'Warranty - 24 Months',
        category: 'warranty',
        terms: [
            'Warranty: 24 months from date of commissioning or 30 months from dispatch, whichever is earlier.',
            'Warranty covers manufacturing defects only.',
            'Consumables and wear parts are not covered under warranty.',
            'Annual Maintenance Contract (AMC) available post warranty period.'
        ]
    },
    {
        label: 'Installation & Commissioning',
        category: 'general',
        terms: [
            'Installation & commissioning supervision will be provided by our qualified engineers.',
            'Civil and electrical work at site: Buyer\'s scope.',
            'Crane, forklift and other handling equipment at site: Buyer\'s scope.',
            'Accommodation and local transport for our engineers: Buyer\'s scope.',
            'Commissioning consumables and utilities (power, water, compressed air): Buyer\'s scope.',
            'Training of buyer\'s operators will be provided during commissioning.'
        ]
    },
    {
        label: 'Supply Only - No Installation',
        category: 'general',
        terms: [
            'Scope: Supply of equipment/material only.',
            'Installation, commissioning and testing: Not included / Buyer\'s scope.',
            'Technical assistance for installation available at extra cost if required.',
            'User manual and technical documentation will be provided with supply.'
        ]
    }
];

// GET - Fetch all saved T&C presets (system + user created)
export async function GET(req: Request) {
    try {
        const { userId } = await getAuthenticatedUser(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Fetch user's custom presets
        const userPresets = await SavedTermsCondition.find({ userId })
            .sort({ usageCount: -1, updatedAt: -1 });

        // Combine system presets with user presets
        const systemPresetsFormatted = SYSTEM_PRESETS.map((preset, idx) => ({
            _id: `system-${idx}`,
            label: preset.label,
            terms: preset.terms,
            category: preset.category,
            isSystemPreset: true,
            isDefault: false,
            usageCount: 0
        }));

        return NextResponse.json({
            presets: [...userPresets, ...systemPresetsFormatted]
        });
    } catch (error) {
        console.error('Error fetching T&C presets:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST - Create a new custom T&C preset
export async function POST(req: Request) {
    try {
        const { userId } = await getAuthenticatedUser(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await req.json();

        const { label, terms, category, isDefault } = body;

        if (!label || !terms || terms.length === 0) {
            return NextResponse.json({ error: 'Label and at least one term are required' }, { status: 400 });
        }

        // If setting as default, unset other defaults
        if (isDefault) {
            await SavedTermsCondition.updateMany({ userId, isDefault: true }, { isDefault: false });
        }

        const preset = await SavedTermsCondition.create({
            userId,
            label,
            terms,
            category: category || 'custom',
            isDefault: isDefault || false,
            isSystemPreset: false,
            usageCount: 0
        });

        return NextResponse.json({ preset });
    } catch (error) {
        console.error('Error creating T&C preset:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT - Update an existing custom T&C preset
export async function PUT(req: Request) {
    try {
        const { userId } = await getAuthenticatedUser(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await req.json();
        const { id, label, terms, category } = body;

        if (!id || id.startsWith('system-')) {
            return NextResponse.json({ error: 'Cannot update system presets' }, { status: 400 });
        }

        if (!terms || terms.length === 0) {
            return NextResponse.json({ error: 'At least one term is required' }, { status: 400 });
        }

        const preset = await SavedTermsCondition.findOneAndUpdate(
            { _id: id, userId },
            { label: label || undefined, terms, category: category || 'custom' },
            { new: true }
        );

        if (!preset) {
            return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
        }

        return NextResponse.json({ preset });
    } catch (error) {
        console.error('Error updating T&C preset:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE - Delete a custom T&C preset
export async function DELETE(req: Request) {
    try {
        const { userId } = await getAuthenticatedUser(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { searchParams } = new URL(req.url);
        const presetId = searchParams.get('id');

        if (!presetId) {
            return NextResponse.json({ error: 'Preset ID required' }, { status: 400 });
        }

        // Don't allow deleting system presets
        if (presetId.startsWith('system-')) {
            return NextResponse.json({ error: 'Cannot delete system presets' }, { status: 400 });
        }

        await SavedTermsCondition.deleteOne({ _id: presetId, userId });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting T&C preset:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
