'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PanelItem {
    name: string;
    qty: string;
    remarks: string;
}

interface TechnicalSpec {
    parameter: string;
    requirement: string;
    offered: string;
}

interface BillItem {
    panel: string;
    description: string;
}

interface SupplyItem {
    item: string;
    qty: string;
    unitPrice: string;
    amount: string;
}

export default function TechnoQuotationPage() {
    // Company Information & Logo
    const [logoUrl, setLogoUrl] = useState('');
    const [logoLetter, setLogoLetter] = useState('G');
    const [companyName, setCompanyName] = useState('GREEN ENERGY PVT. LTD');
    const [companyId, setCompanyId] = useState('GREEN - 2RAAGPV24KEP');
    const [companyAddress1, setCompanyAddress1] = useState('Malad - 400 064');
    const [companyAddress2, setCompanyAddress2] = useState('Mumbai, Maharashtra, India');
    const [companyPhone, setCompanyPhone] = useState('+91 99205 21473');
    const [companyDate, setCompanyDate] = useState('Thursday, March 06th');

    // Main Title
    const [mainTitle, setMainTitle] = useState('TECHNO COMMERCIAL QUOTATION');

    // Section Headings
    const [panelSectionHeading, setPanelSectionHeading] = useState('Panel');
    const [technicalComplianceHeading, setTechnicalComplianceHeading] = useState('Technical Compliance');
    const [billOfQuantityHeading, setBillOfQuantityHeading] = useState('Bill of Quantity Summary');
    const [billOfQuantitySubtitle, setBillOfQuantitySubtitle] = useState('(Mentioned in RP TS — reference BOM\'s)');
    const [commercialOffersHeading, setCommercialOffersHeading] = useState('Commercial Offers');
    const [supplyHeading, setSupplyHeading] = useState('1. Supply');
    const [erectionHeading, setErectionHeading] = useState('2. Erection, Testing & Commissioning');
    const [freightHeading, setFreightHeading] = useState('3. Freight & Insurance');
    const [termsHeading, setTermsHeading] = useState('Terms & Conditions');

    // Table Column Headers - Panel Table
    const [panelColPanel, setPanelColPanel] = useState('Panel');
    const [panelColQty, setPanelColQty] = useState('Qty');
    const [panelColRemarks, setPanelColRemarks] = useState('Remarks');

    // Table Column Headers - Technical Compliance
    const [techColParameter, setTechColParameter] = useState('Parameter');
    const [techColRequirement, setTechColRequirement] = useState('Requirement');
    const [techColOffered, setTechColOffered] = useState('Offered');

    // Table Column Headers - Bill of Quantity
    const [billColPanel, setBillColPanel] = useState('Panel');
    const [billColComponents, setBillColComponents] = useState('Key Components');

    // Table Column Headers - Commercial Tables
    const [commColItem, setCommColItem] = useState('Item');
    const [commColQty, setCommColQty] = useState('Qty');
    const [commColQtyUnit, setCommColQtyUnit] = useState('(In Nos)');
    const [commColUnitPrice, setCommColUnitPrice] = useState('Unit Price');
    const [commColUnitPriceUnit, setCommColUnitPriceUnit] = useState('(In Rs.)');
    const [commColAmount, setCommColAmount] = useState('Amount');
    const [commColAmountUnit, setCommColAmountUnit] = useState('(In Rs.)');

    const [refNo, setRefNo] = useState('PTP/305/DAAN/2025-26/0181');
    const [date, setDate] = useState('04/05/2025');
    const [customerName, setCustomerName] = useState('The Head Plant - SAIL');
    const [customerAddress, setCustomerAddress] = useState('DSM, CSTL & SMRH');
    const [customerCity, setCustomerCity] = useState('Bhilai, Chhattisgarh');

    const [projectTitle, setProjectTitle] = useState('Supply & Erection of Crane Control Panels (Main Hoist, Aux Hoist, LT, CT, Aux CT)');
    const [projectDescription, setProjectDescription] = useState('We thank you for the opportunity to submit the techno-commercial quotation for replacement of existing crane control panels as per the scope mentioned below. We are pleased to submit our quotation from a reputed & renowned manufacturer.');

    const [scopeItems, setScopeItems] = useState([
        'TP for Main Hoist, Aux Hoist, LT, CT, & Aux CT Panels',
        'GA Drawings issued by BSP',
        'Stinger',
        'Supply, ereg, testing, setting, testing, documentation as EAT'
    ]);

    const [panels, setPanels] = useState<PanelItem[]>([
        { name: 'Main Hoist Control + Festooning Panel', qty: '1 Sets', remarks: 'Includes 900A DC contactors & TKP replacement' },
        { name: 'Aux Hoist Panel', qty: '1 Sets', remarks: 'As per TP spec' },
        { name: 'Long Travel Panel', qty: '1 Sets', remarks: 'As per TP spec' },
        { name: 'Cross Travel Panel', qty: '1 Sets', remarks: 'Suitable FLP enclosure' },
        { name: 'Aux Cross Travel Panel', qty: '1 Sets', remarks: 'As per BOM' }
    ]);

    const [technicalSpecs, setTechnicalSpecs] = useState<TechnicalSpec[]>([
        { parameter: 'Incoming Voltage', requirement: '415V AC', offered: 'Complied' },
        { parameter: 'Control Voltage', requirement: '220V DC', offered: 'Complied' },
        { parameter: 'IP Rating Dimensions', requirement: 'As per TP', offered: 'Complied' },
        { parameter: 'FLP Short Mounting', requirement: 'Mandatory', offered: 'Provided' },
        { parameter: 'Wiring', requirement: 'As per BOM', offered: 'Complied' },
        { parameter: 'Enclosures', requirement: 'CRCA/SS, IP-65/IP67', offered: 'Complied' },
        { parameter: 'Environment', requirement: 'High temperature & dusty', offered: 'Suitable components' }
    ]);

    const [billItems, setBillItems] = useState<BillItem[]>([
        { panel: 'Main Hoist', description: '900A DC contactors, Bus-Duct Hoist, brush transfer switches' },
        { panel: 'Aux Hoist', description: '500A DC contactors, without relays' },
        { panel: 'LT', description: '500A DC contactors, mechanical interlocks, timers' },
        { panel: 'CT', description: '500A DC contactors, plug-n relays' },
        { panel: 'Aux CT', description: '100A DC contactors, RKC cams, isolators' }
    ]);

    const [supplyItems, setSupplyItems] = useState<SupplyItem[]>([
        { item: 'Main Hoist Panels', qty: '1', unitPrice: '3225504', amount: '9625617' },
        { item: 'Aux Hoist Panels', qty: '1', unitPrice: '432440', amount: '1297544' },
        { item: 'Long Travel Panels', qty: '1', unitPrice: '167716', amount: '502736' },
        { item: 'Cross Travel Panels', qty: '1', unitPrice: '62995', amount: '189456' },
        { item: 'Auxiliary Cross Travel Panels', qty: '1', unitPrice: '44196', amount: '132670' }
    ]);

    const [erectionQty, setErectionQty] = useState('1');
    const [erectionUnitPrice, setErectionUnitPrice] = useState('2300500');
    const [erectionAmount, setErectionAmount] = useState('6901500');

    const [freightQty, setFreightQty] = useState('1');
    const [freightUnitPrice, setFreightUnitPrice] = useState('113000');
    const [freightAmount, setFreightAmount] = useState('113000');

    const [deliverySchedule, setDeliverySchedule] = useState('12-16 Weeks after approval of drawings');
    const [paymentTerms, setPaymentTerms] = useState([
        '60% Advance on Proforma PO',
        '40% after FAT at our works',
        '10% Before Dispatch'
    ]);
    const [warranty, setWarranty] = useState('18 Months from supply / 12 Months from commissioning');
    const [documents, setDocuments] = useState([
        'GA & SAT - soft formats',
        'Instruction Manual, O&M Manual, FAT Report',
        'Routine Philosophy & Cable Schedule'
    ]);

    // Footer Content
    const [footerLine1, setFooterLine1] = useState('Solar Solutions | Owner & VP and Power Plans | Water Heater | Street Lights | Home Lighting');
    const [footerLine2, setFooterLine2] = useState('LED Lighting Solutions | Inverters | Commercial | Industrial | Customized solution');
    const [footerLine3, setFooterLine3] = useState('Authorized Submitter: SANTOSH - M.D. - SCADA / PDD');

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <div className="no-print">
                <Navbar />
                <div className="bg-gradient-to-br from-emerald-500/10 via-background to-teal-500/10 py-8">
                    <div className="container px-4">
                        <Link href="/accounting" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Accounting
                        </Link>
                        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                            Techno Commercial Quotation
                        </h1>
                        <p className="text-muted-foreground mb-4">
                            Fill in the details below. Click fields to edit. Print when ready.
                        </p>
                        <Button
                            onClick={handlePrint}
                            size="lg"
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                        >
                            <Printer className="w-5 h-5 mr-2" />
                            Print Quotation
                        </Button>
                    </div>
                </div>
            </div>

            {/* Quotation Pages */}
            <div className="quotation-container">
                {/* PAGE 1 */}
                <div className="page">
                    <div className="header">
                        <div className="logo-section">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Company Logo" className="logo-image" />
                            ) : (
                                <div className="logo-circle" contentEditable suppressContentEditableWarning onBlur={(e) => setLogoLetter(e.currentTarget.textContent || 'G')}>
                                    {logoLetter}
                                </div>
                            )}
                            <div>
                                <input
                                    type="text"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    className="editable-field company-name-field"
                                />
                                <div className="no-print" style={{ marginTop: '5px' }}>
                                    <label htmlFor="logo-upload" style={{ cursor: 'pointer', fontSize: '9px', color: '#666', textDecoration: 'underline' }}>
                                        Upload Logo
                                    </label>
                                    <input
                                        id="logo-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="header-info">
                            <p><strong><input type="text" value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="editable-field" /></strong></p>
                            <p><input type="text" value={companyAddress1} onChange={(e) => setCompanyAddress1(e.target.value)} className="editable-field" /></p>
                            <p><input type="text" value={companyAddress2} onChange={(e) => setCompanyAddress2(e.target.value)} className="editable-field" /></p>
                            <p>Phone: <input type="text" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} className="editable-field" /></p>
                            <p><input type="text" value={companyDate} onChange={(e) => setCompanyDate(e.target.value)} className="editable-field" /></p>
                        </div>
                    </div>

                    <h1 className="main-title">
                        <input
                            type="text"
                            value={mainTitle}
                            onChange={(e) => setMainTitle(e.target.value)}
                            className="editable-field main-title-field"
                        />
                    </h1>

                    <div className="ref-section">
                        <p>
                            <strong>Ref No:</strong>{' '}
                            <input
                                type="text"
                                value={refNo}
                                onChange={(e) => setRefNo(e.target.value)}
                                className="editable-field"
                            />
                        </p>
                        <p>
                            <strong>Date:</strong>{' '}
                            <input
                                type="text"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="editable-field"
                            />
                        </p>
                    </div>

                    <div className="customer-section">
                        <p><strong>To,</strong></p>
                        <p>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="editable-field full-width"
                            />
                        </p>
                        <p>
                            <input
                                type="text"
                                value={customerAddress}
                                onChange={(e) => setCustomerAddress(e.target.value)}
                                className="editable-field full-width"
                            />
                        </p>
                        <p>
                            <input
                                type="text"
                                value={customerCity}
                                onChange={(e) => setCustomerCity(e.target.value)}
                                className="editable-field full-width"
                            />
                        </p>
                    </div>

                    <p><strong>Dear Sir,</strong></p>
                    <p>
                        <textarea
                            value={projectDescription}
                            onChange={(e) => setProjectDescription(e.target.value)}
                            className="editable-field full-width"
                            rows={3}
                        />
                    </p>

                    <p><strong>Scope:</strong></p>
                    <ul>
                        {scopeItems.map((item, index) => (
                            <li key={index}>
                                <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => {
                                        const newItems = [...scopeItems];
                                        newItems[index] = e.target.value;
                                        setScopeItems(newItems);
                                    }}
                                    className="editable-field full-width"
                                />
                            </li>
                        ))}
                    </ul>

                    <h3 className="section-heading">
                        <input
                            type="text"
                            value={panelSectionHeading}
                            onChange={(e) => setPanelSectionHeading(e.target.value)}
                            className="editable-field section-heading-field"
                        />
                    </h3>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="text"
                                        value={panelColPanel}
                                        onChange={(e) => setPanelColPanel(e.target.value)}
                                        className="editable-field table-header-field"
                                    />
                                </th>
                                <th>
                                    <input
                                        type="text"
                                        value={panelColQty}
                                        onChange={(e) => setPanelColQty(e.target.value)}
                                        className="editable-field table-header-field"
                                    />
                                </th>
                                <th>
                                    <input
                                        type="text"
                                        value={panelColRemarks}
                                        onChange={(e) => setPanelColRemarks(e.target.value)}
                                        className="editable-field table-header-field"
                                    />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {panels.map((panel, index) => (
                                <tr key={index}>
                                    <td>
                                        <input
                                            type="text"
                                            value={panel.name}
                                            onChange={(e) => {
                                                const newPanels = [...panels];
                                                newPanels[index].name = e.target.value;
                                                setPanels(newPanels);
                                            }}
                                            className="editable-field full-width"
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            value={panel.qty}
                                            onChange={(e) => {
                                                const newPanels = [...panels];
                                                newPanels[index].qty = e.target.value;
                                                setPanels(newPanels);
                                            }}
                                            className="editable-field"
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            value={panel.remarks}
                                            onChange={(e) => {
                                                const newPanels = [...panels];
                                                newPanels[index].remarks = e.target.value;
                                                setPanels(newPanels);
                                            }}
                                            className="editable-field full-width"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <p className="note">
                        Cabling, FRP duct replacement, lugs, drawings, QAP, FAT, commissioning support included.
                    </p>

                    <div className="footer">
                        <p>Page 1 of 4</p>
                        <p>
                            <input
                                type="text"
                                value={footerLine1}
                                onChange={(e) => setFooterLine1(e.target.value)}
                                className="editable-field full-width footer-field"
                            />
                            <br />
                            <input
                                type="text"
                                value={footerLine2}
                                onChange={(e) => setFooterLine2(e.target.value)}
                                className="editable-field full-width footer-field"
                            />
                            <br />
                            <input
                                type="text"
                                value={footerLine3}
                                onChange={(e) => setFooterLine3(e.target.value)}
                                className="editable-field full-width footer-field"
                            />
                        </p>
                    </div>
                </div>

                {/* PAGE 2 */}
                <div className="page">
                    <div className="header">
                        <div className="logo-section">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Company Logo" className="logo-image" />
                            ) : (
                                <div className="logo-circle">{logoLetter}</div>
                            )}
                            <div className="company-name">{companyName}</div>
                        </div>
                        <div className="header-info">
                            <p><strong>{companyId}</strong></p>
                            <p>{companyAddress1}</p>
                            <p>{companyAddress2}</p>
                            <p>Phone: {companyPhone}</p>
                            <p>{companyDate}</p>
                        </div>
                    </div>

                    <h2 className="section-title">
                        <input
                            type="text"
                            value={technicalComplianceHeading}
                            onChange={(e) => setTechnicalComplianceHeading(e.target.value)}
                            className="editable-field section-title-field"
                        />
                    </h2>

                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="text"
                                        value={techColParameter}
                                        onChange={(e) => setTechColParameter(e.target.value)}
                                        className="editable-field table-header-field"
                                    />
                                </th>
                                <th>
                                    <input
                                        type="text"
                                        value={techColRequirement}
                                        onChange={(e) => setTechColRequirement(e.target.value)}
                                        className="editable-field table-header-field"
                                    />
                                </th>
                                <th>
                                    <input
                                        type="text"
                                        value={techColOffered}
                                        onChange={(e) => setTechColOffered(e.target.value)}
                                        className="editable-field table-header-field"
                                    />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {technicalSpecs.map((spec, index) => (
                                <tr key={index}>
                                    <td>
                                        <input
                                            type="text"
                                            value={spec.parameter}
                                            onChange={(e) => {
                                                const newSpecs = [...technicalSpecs];
                                                newSpecs[index].parameter = e.target.value;
                                                setTechnicalSpecs(newSpecs);
                                            }}
                                            className="editable-field full-width"
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            value={spec.requirement}
                                            onChange={(e) => {
                                                const newSpecs = [...technicalSpecs];
                                                newSpecs[index].requirement = e.target.value;
                                                setTechnicalSpecs(newSpecs);
                                            }}
                                            className="editable-field full-width"
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            value={spec.offered}
                                            onChange={(e) => {
                                                const newSpecs = [...technicalSpecs];
                                                newSpecs[index].offered = e.target.value;
                                                setTechnicalSpecs(newSpecs);
                                            }}
                                            className="editable-field full-width"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <h3 className="section-heading mt-6">
                        <input
                            type="text"
                            value={billOfQuantityHeading}
                            onChange={(e) => setBillOfQuantityHeading(e.target.value)}
                            className="editable-field section-heading-field"
                        />
                    </h3>
                    <p className="subtitle">
                        <input
                            type="text"
                            value={billOfQuantitySubtitle}
                            onChange={(e) => setBillOfQuantitySubtitle(e.target.value)}
                            className="editable-field full-width"
                        />
                    </p>

                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="text"
                                        value={billColPanel}
                                        onChange={(e) => setBillColPanel(e.target.value)}
                                        className="editable-field table-header-field"
                                    />
                                </th>
                                <th>
                                    <input
                                        type="text"
                                        value={billColComponents}
                                        onChange={(e) => setBillColComponents(e.target.value)}
                                        className="editable-field table-header-field"
                                    />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {billItems.map((item, index) => (
                                <tr key={index}>
                                    <td>
                                        <input
                                            type="text"
                                            value={item.panel}
                                            onChange={(e) => {
                                                const newItems = [...billItems];
                                                newItems[index].panel = e.target.value;
                                                setBillItems(newItems);
                                            }}
                                            className="editable-field full-width"
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            value={item.description}
                                            onChange={(e) => {
                                                const newItems = [...billItems];
                                                newItems[index].description = e.target.value;
                                                setBillItems(newItems);
                                            }}
                                            className="editable-field full-width"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="footer">
                        <p>Page 2 of 4</p>
                        <p>
                            {footerLine1}
                            <br />
                            {footerLine2}
                            <br />
                            {footerLine3}
                        </p>
                    </div>
                </div>

                {/* PAGE 3 */}
                <div className="page">
                    <div className="header">
                        <div className="logo-section">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Company Logo" className="logo-image" />
                            ) : (
                                <div className="logo-circle">{logoLetter}</div>
                            )}
                            <div className="company-name">{companyName}</div>
                        </div>
                        <div className="header-info">
                            <p><strong>{companyId}</strong></p>
                            <p>{companyAddress1}</p>
                            <p>{companyAddress2}</p>
                            <p>Phone: {companyPhone}</p>
                            <p>{companyDate}</p>
                        </div>
                    </div>

                    <h2 className="section-title">
                        <input
                            type="text"
                            value={commercialOffersHeading}
                            onChange={(e) => setCommercialOffersHeading(e.target.value)}
                            className="editable-field section-title-field"
                        />
                    </h2>

                    <h3 className="section-heading">
                        <input
                            type="text"
                            value={supplyHeading}
                            onChange={(e) => setSupplyHeading(e.target.value)}
                            className="editable-field section-heading-field"
                        />
                    </h3>
                    <table className="data-table price-table">
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="text"
                                        value={commColItem}
                                        onChange={(e) => setCommColItem(e.target.value)}
                                        className="editable-field table-header-field"
                                    />
                                </th>
                                <th>
                                    <input
                                        type="text"
                                        value={commColQty}
                                        onChange={(e) => setCommColQty(e.target.value)}
                                        className="editable-field table-header-field"
                                    />
                                    <br />
                                    <input
                                        type="text"
                                        value={commColQtyUnit}
                                        onChange={(e) => setCommColQtyUnit(e.target.value)}
                                        className="editable-field table-header-field"
                                    />
                                </th>
                                <th>
                                    <input
                                        type="text"
                                        value={commColUnitPrice}
                                        onChange={(e) => setCommColUnitPrice(e.target.value)}
                                        className="editable-field table-header-field"
                                    />
                                    <br />
                                    <input
                                        type="text"
                                        value={commColUnitPriceUnit}
                                        onChange={(e) => setCommColUnitPriceUnit(e.target.value)}
                                        className="editable-field table-header-field"
                                    />
                                </th>
                                <th>
                                    <input
                                        type="text"
                                        value={commColAmount}
                                        onChange={(e) => setCommColAmount(e.target.value)}
                                        className="editable-field table-header-field"
                                    />
                                    <br />
                                    <input
                                        type="text"
                                        value={commColAmountUnit}
                                        onChange={(e) => setCommColAmountUnit(e.target.value)}
                                        className="editable-field table-header-field"
                                    />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {supplyItems.map((item, index) => (
                                <tr key={index}>
                                    <td>
                                        <input
                                            type="text"
                                            value={item.item}
                                            onChange={(e) => {
                                                const newItems = [...supplyItems];
                                                newItems[index].item = e.target.value;
                                                setSupplyItems(newItems);
                                            }}
                                            className="editable-field full-width"
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            value={item.qty}
                                            onChange={(e) => {
                                                const newItems = [...supplyItems];
                                                newItems[index].qty = e.target.value;
                                                setSupplyItems(newItems);
                                            }}
                                            className="editable-field text-right"
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            value={item.unitPrice}
                                            onChange={(e) => {
                                                const newItems = [...supplyItems];
                                                newItems[index].unitPrice = e.target.value;
                                                setSupplyItems(newItems);
                                            }}
                                            className="editable-field text-right"
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            value={item.amount}
                                            onChange={(e) => {
                                                const newItems = [...supplyItems];
                                                newItems[index].amount = e.target.value;
                                                setSupplyItems(newItems);
                                            }}
                                            className="editable-field text-right"
                                        />
                                    </td>
                                </tr>
                            ))}
                            <tr className="total-row">
                                <td colSpan={3}><strong>1. Total Amount (In Rs)</strong></td>
                                <td><strong>19164864</strong></td>
                            </tr>
                        </tbody>
                    </table>

                    <h3 className="section-heading mt-4">
                        <input
                            type="text"
                            value={erectionHeading}
                            onChange={(e) => setErectionHeading(e.target.value)}
                            className="editable-field section-heading-field"
                        />
                    </h3>
                    <table className="data-table price-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Qty<br />(In Nos)</th>
                                <th>Unit Price<br />(In Rs.)</th>
                                <th>Amount<br />(In Rs.)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Erection, testing & Commissioning</td>
                                <td>
                                    <input
                                        type="text"
                                        value={erectionQty}
                                        onChange={(e) => setErectionQty(e.target.value)}
                                        className="editable-field text-right"
                                    />
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        value={erectionUnitPrice}
                                        onChange={(e) => setErectionUnitPrice(e.target.value)}
                                        className="editable-field text-right"
                                    />
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        value={erectionAmount}
                                        onChange={(e) => setErectionAmount(e.target.value)}
                                        className="editable-field text-right"
                                    />
                                </td>
                            </tr>
                            <tr className="total-row">
                                <td colSpan={3}><strong>2. Total Amount (In Rs)</strong></td>
                                <td><strong>{erectionAmount}</strong></td>
                            </tr>
                        </tbody>
                    </table>

                    <h3 className="section-heading mt-4">
                        <input
                            type="text"
                            value={freightHeading}
                            onChange={(e) => setFreightHeading(e.target.value)}
                            className="editable-field section-heading-field"
                        />
                    </h3>
                    <table className="data-table price-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Qty<br />(In Nos)</th>
                                <th>Unit Price<br />(In Rs.)</th>
                                <th>Amount<br />(In Rs.)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Freight & Insurance</td>
                                <td>
                                    <input
                                        type="text"
                                        value={freightQty}
                                        onChange={(e) => setFreightQty(e.target.value)}
                                        className="editable-field text-right"
                                    />
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        value={freightUnitPrice}
                                        onChange={(e) => setFreightUnitPrice(e.target.value)}
                                        className="editable-field text-right"
                                    />
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        value={freightAmount}
                                        onChange={(e) => setFreightAmount(e.target.value)}
                                        className="editable-field text-right"
                                    />
                                </td>
                            </tr>
                            <tr className="total-row">
                                <td colSpan={3}><strong>3. Total Amount (In Rs)</strong></td>
                                <td><strong>{freightAmount}</strong></td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="footer">
                        <p>Page 3 of 4</p>
                        <p>
                            {footerLine1}
                            <br />
                            {footerLine2}
                            <br />
                            {footerLine3}
                        </p>
                    </div>
                </div>

                {/* PAGE 4 */}
                <div className="page">
                    <div className="header">
                        <div className="logo-section">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Company Logo" className="logo-image" />
                            ) : (
                                <div className="logo-circle">{logoLetter}</div>
                            )}
                            <div className="company-name">{companyName}</div>
                        </div>
                        <div className="header-info">
                            <p><strong>{companyId}</strong></p>
                            <p>{companyAddress1}</p>
                            <p>{companyAddress2}</p>
                            <p>Phone: {companyPhone}</p>
                            <p>{companyDate}</p>
                        </div>
                    </div>

                    <h2 className="section-title">
                        <input
                            type="text"
                            value={termsHeading}
                            onChange={(e) => setTermsHeading(e.target.value)}
                            className="editable-field section-title-field"
                        />
                    </h2>

                    <div className="terms-content">
                        <h3 className="terms-heading">Delivery Schedule</h3>
                        <ul>
                            <li>
                                <input
                                    type="text"
                                    value={deliverySchedule}
                                    onChange={(e) => setDeliverySchedule(e.target.value)}
                                    className="editable-field full-width"
                                />
                            </li>
                        </ul>

                        <h3 className="terms-heading">Payment Terms</h3>
                        <ul>
                            {paymentTerms.map((term, index) => (
                                <li key={index}>
                                    <input
                                        type="text"
                                        value={term}
                                        onChange={(e) => {
                                            const newTerms = [...paymentTerms];
                                            newTerms[index] = e.target.value;
                                            setPaymentTerms(newTerms);
                                        }}
                                        className="editable-field full-width"
                                    />
                                </li>
                            ))}
                        </ul>

                        <h3 className="terms-heading">Warranty</h3>
                        <ul>
                            <li>
                                <input
                                    type="text"
                                    value={warranty}
                                    onChange={(e) => setWarranty(e.target.value)}
                                    className="editable-field full-width"
                                />
                            </li>
                        </ul>

                        <h3 className="terms-heading">Documents Submitted</h3>
                        <ul>
                            {documents.map((doc, index) => (
                                <li key={index}>
                                    <input
                                        type="text"
                                        value={doc}
                                        onChange={(e) => {
                                            const newDocs = [...documents];
                                            newDocs[index] = e.target.value;
                                            setDocuments(newDocs);
                                        }}
                                        className="editable-field full-width"
                                    />
                                </li>
                            ))}
                        </ul>

                        <h3 className="terms-heading">Acceptance</h3>
                        <p>We request you to review & issue PO.</p>

                        <div className="company-signature">
                            <p><strong>For GREEN ENERGY PVT LTD</strong></p>
                            <p>General Bazar, Malad</p>
                            <p>Email: info@greenenergy.com</p>
                            <p>Phone: +91 99205 21473</p>
                            <div className="signature-space"></div>
                            <p><strong>SANTOSH - M.D. - SCADA / PDD</strong></p>
                        </div>
                    </div>

                    <div className="footer">
                        <p>Page 4 of 4</p>
                        <p>
                            {footerLine1}
                            <br />
                            {footerLine2}
                            <br />
                            {footerLine3}
                        </p>
                    </div>
                </div>
            </div>

            <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          .quotation-container {
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            width: 210mm !important;
          }
          
          .page {
            page-break-after: always !important;
            page-break-inside: avoid !important;
            margin: 0 !important;
            padding: 15mm 20mm 25mm 20mm !important;
            box-shadow: none !important;
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            background: white !important;
            position: relative !important;
            overflow: hidden !important;
          }
          
          .page:last-child {
            page-break-after: auto !important;
          }
          
          .editable-field,
          .company-name-field,
          .main-title-field,
          .section-title-field,
          .section-heading-field,
          .table-header-field,
          .footer-field {
            border: none !important;
            background: transparent !important;
            outline: none !important;
          }
          
          .header {
            margin-bottom: 12px !important;
            padding-bottom: 10px !important;
          }
          
          .main-title {
            margin: 15px 0 !important;
            font-size: 16px !important;
          }
          
          .section-title {
            margin: 12px 0 !important;
            font-size: 14px !important;
          }
          
          .section-heading {
            margin: 10px 0 8px 0 !important;
            font-size: 12px !important;
          }
          
          .data-table {
            margin: 10px 0 !important;
            font-size: 9px !important;
          }
          
          .data-table th,
          .data-table td {
            padding: 5px !important;
          }
          
          .ref-section,
          .customer-section {
            margin: 10px 0 !important;
          }
          
          .terms-content {
            font-size: 10px !important;
          }
          
          .terms-heading {
            font-size: 11px !important;
            margin-top: 10px !important;
            margin-bottom: 5px !important;
          }
          
          .footer {
            position: absolute !important;
            bottom: 10mm !important;
            left: 20mm !important;
            right: 20mm !important;
            font-size: 7px !important;
            line-height: 1.3 !important;
            padding-top: 8px !important;
          }
          
          .company-signature {
            margin-top: 20px !important;
          }
          
          .signature-space {
            height: 40px !important;
            margin: 15px 0 !important;
          }
          
          ul {
            margin: 5px 0 !important;
            padding-left: 18px !important;
          }
          
          li {
            margin: 3px 0 !important;
          }
          
          p {
            margin: 5px 0 !important;
          }
          
          .note,
          .subtitle {
            font-size: 9px !important;
            margin: 8px 0 !important;
          }
          
          .mt-4 {
            margin-top: 12px !important;
          }
          
          .mt-6 {
            margin-top: 16px !important;
          }
        }

        @media screen {
          .quotation-container {
            max-width: 210mm;
            margin: 20px auto;
            background: #f5f5f5;
            padding: 20px;
          }
        }

        .page {
          width: 210mm;
          min-height: 297mm;
          padding: 20mm;
          background: white;
          margin-bottom: 20px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          position: relative;
          font-family: Arial, sans-serif;
          font-size: 11px;
          line-height: 1.6;
          color: #000;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 3px solid #4CAF50;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .logo-circle {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4CAF50, #45a049);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: bold;
        }

        .company-name {
          font-size: 14px;
          font-weight: bold;
          color: #4CAF50;
        }

        .header-info {
          text-align: right;
          font-size: 9px;
          line-height: 1.4;
        }

        .main-title {
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          text-decoration: underline;
          margin: 25px 0;
        }

        .section-title {
          text-align: center;
          font-size: 16px;
          font-weight: bold;
          text-decoration: underline;
          margin: 20px 0;
        }

        .section-heading {
          font-size: 13px;
          font-weight: bold;
          margin: 15px 0 10px 0;
        }

        .ref-section {
          margin: 15px 0;
          font-size: 11px;
        }

        .customer-section {
          margin: 20px 0;
          font-size: 11px;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          font-size: 10px;
        }

        .data-table th,
        .data-table td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
        }

        .data-table th {
          background-color: #f0f0f0;
          font-weight: bold;
          text-align: center;
        }

        .price-table td:nth-child(2),
        .price-table td:nth-child(3),
        .price-table td:nth-child(4) {
          text-align: right;
        }

        .total-row {
          background-color: #f9f9f9;
          font-weight: bold;
        }

        .editable-field {
          border: 1px dashed #ccc;
          background: #fafafa;
          padding: 4px 6px;
          font-family: Arial, sans-serif;
          font-size: inherit;
          width: auto;
          min-width: 60px;
        }

        .editable-field:focus {
          outline: 2px solid #4CAF50;
          background: white;
        }

        .editable-field.full-width {
          width: 100%;
        }

        .editable-field.text-right {
          text-align: right;
        }

        .logo-image {
          width: 50px;
          height: 50px;
          object-fit: contain;
          border-radius: 50%;
        }

        .company-name-field {
          font-size: 14px;
          font-weight: bold;
          color: #4CAF50;
          border: 1px dashed #ccc;
          background: #fafafa;
          padding: 4px 6px;
        }

        .company-name-field:focus {
          outline: 2px solid #4CAF50;
          background: white;
        }

        .main-title-field {
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          width: 100%;
          border: 1px dashed #ccc;
          background: #fafafa;
          padding: 8px;
        }

        .main-title-field:focus {
          outline: 2px solid #4CAF50;
          background: white;
        }

        .section-title-field {
          text-align: center;
          font-size: 16px;
          font-weight: bold;
          width: 100%;
          border: 1px dashed #ccc;
          background: #fafafa;
          padding: 6px;
        }

        .section-title-field:focus {
          outline: 2px solid #4CAF50;
          background: white;
        }

        .section-heading-field {
          font-size: 13px;
          font-weight: bold;
          width: auto;
          min-width: 200px;
          border: 1px dashed #ccc;
          background: #fafafa;
          padding: 4px 6px;
        }

        .section-heading-field:focus {
          outline: 2px solid #4CAF50;
          background: white;
        }

        .table-header-field {
          font-weight: bold;
          text-align: center;
          width: 100%;
          border: 1px dashed #ccc;
          background: #f0f0f0;
          padding: 4px;
          font-size: 10px;
        }

        .table-header-field:focus {
          outline: 2px solid #4CAF50;
          background: white;
        }

        .note {
          font-size: 10px;
          font-style: italic;
          margin: 10px 0;
        }

        .subtitle {
          font-size: 10px;
          font-style: italic;
          margin-bottom: 10px;
        }

        .mt-4 {
          margin-top: 16px;
        }

        .mt-6 {
          margin-top: 24px;
        }

        .terms-content {
          font-size: 11px;
        }

        .terms-heading {
          font-size: 12px;
          font-weight: bold;
          margin-top: 15px;
          margin-bottom: 8px;
        }

        .terms-content ul {
          margin: 5px 0;
          padding-left: 20px;
        }

        .terms-content li {
          margin: 5px 0;
        }

        .company-signature {
          margin-top: 40px;
          font-size: 11px;
        }

        .signature-space {
          height: 60px;
          margin: 20px 0;
        }

        .footer {
          position: absolute;
          bottom: 15mm;
          left: 20mm;
          right: 20mm;
          border-top: 1px solid #ccc;
          padding-top: 10px;
          font-size: 8px;
          text-align: center;
          line-height: 1.4;
        }

        .footer-field {
          font-size: 8px;
          line-height: 1.4;
          text-align: center;
          border: 1px dashed #ccc;
          background: #fafafa;
          padding: 2px 4px;
        }

        .footer-field:focus {
          outline: 2px solid #4CAF50;
          background: white;
        }
      `}</style>

            <Footer />
        </>
    );
}
