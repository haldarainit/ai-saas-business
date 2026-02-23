"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import {
    Building2,
    Plus,
    Trash2,
    Edit3,
    Save,
    X,
    Star,
    Loader2,
    ArrowLeft,
    Banknote,
    FileText,
    Shield,
    Check,
    ChevronDown,
    ChevronUp,
    Upload,
    ImageIcon,
    Lock,
    FolderOpen,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import LegalDocumentStore from "@/components/legal-document-store";

interface CompanyProfile {
    _id: string;
    name: string;
    address1?: string;
    address2?: string;
    phone?: string;
    email?: string;
    logo?: string;
    gstin?: string;
    pan?: string;
    website?: string;
    cin?: string;
    tan?: string;
    msmeNumber?: string;
    msmeCategory?: string;
    incorporationDate?: string;
    stateCode?: string;
    bankName?: string;
    bankAccountNo?: string;
    bankIFSC?: string;
    bankBranch?: string;
    authorizedSignatory?: string;
    signatoryDesignation?: string;
    footerLine1?: string;
    footerLine2?: string;
    footerLine3?: string;
    headerLineColor?: string;
    headerValueColor?: string;
    footerLineColor?: string;
    footerTextColor?: string;
    isDefault?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

const emptyProfile: Omit<CompanyProfile, '_id' | 'createdAt' | 'updatedAt'> = {
    name: '',
    address1: '',
    address2: '',
    phone: '',
    email: '',
    logo: '',
    gstin: '',
    pan: '',
    website: '',
    cin: '',
    tan: '',
    msmeNumber: '',
    msmeCategory: '',
    stateCode: '',
    bankName: '',
    bankAccountNo: '',
    bankIFSC: '',
    bankBranch: '',
    authorizedSignatory: '',
    signatoryDesignation: '',
    footerLine1: '',
    footerLine2: '',
    footerLine3: '',
    headerLineColor: '#000000',
    headerValueColor: '#1a1a1a',
    footerLineColor: '#000000',
    footerTextColor: '#1a1a1a',
    isDefault: false,
};

export default function CompanyProfilesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [profiles, setProfiles] = useState<CompanyProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState(emptyProfile);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        basic: true,
        legal: true,
        bank: false,
        footer: false,
    });
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [expandedVaults, setExpandedVaults] = useState<Record<string, boolean>>({});

    const toggleVault = (profileId: string) => {
        setExpandedVaults(prev => ({ ...prev, [profileId]: !prev[profileId] }));
    };

    // Upload logo to Cloudinary
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingLogo(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/upload-file', { method: 'POST', body: fd });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.file?.url) {
                    setFormData(prev => ({ ...prev, logo: data.file.url }));
                    toast({ title: 'Logo uploaded successfully' });
                } else {
                    toast({ title: 'Upload failed', variant: 'destructive' });
                }
            } else {
                toast({ title: 'Upload failed', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error uploading logo', variant: 'destructive' });
        } finally {
            setIsUploadingLogo(false);
        }
    };

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/");
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) fetchProfiles();
    }, [user]);

    const fetchProfiles = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/company-profile');
            if (res.ok) {
                const data = await res.json();
                setProfiles(data.profiles || []);
            }
        } catch (error) {
            console.error('Error fetching profiles:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const startCreate = () => {
        setFormData({ ...emptyProfile, isDefault: profiles.length === 0 });
        setIsCreating(true);
        setEditingId(null);
        setExpandedSections({ basic: true, legal: true, bank: true, footer: false });
    };

    const startEdit = (profile: CompanyProfile) => {
        setFormData({
            name: profile.name || '',
            address1: profile.address1 || '',
            address2: profile.address2 || '',
            phone: profile.phone || '',
            email: profile.email || '',
            logo: profile.logo || '',
            gstin: profile.gstin || '',
            pan: profile.pan || '',
            website: profile.website || '',
            cin: profile.cin || '',
            tan: profile.tan || '',
            msmeNumber: profile.msmeNumber || '',
            msmeCategory: profile.msmeCategory || '',
            incorporationDate: profile.incorporationDate ? new Date(profile.incorporationDate).toISOString().split('T')[0] : '',
            stateCode: profile.stateCode || '',
            bankName: profile.bankName || '',
            bankAccountNo: profile.bankAccountNo || '',
            bankIFSC: profile.bankIFSC || '',
            bankBranch: profile.bankBranch || '',
            authorizedSignatory: profile.authorizedSignatory || '',
            signatoryDesignation: profile.signatoryDesignation || '',
            footerLine1: profile.footerLine1 || '',
            footerLine2: profile.footerLine2 || '',
            footerLine3: profile.footerLine3 || '',
            headerLineColor: profile.headerLineColor || '#000000',
            headerValueColor: profile.headerValueColor || '#1a1a1a',
            footerLineColor: profile.footerLineColor || '#000000',
            footerTextColor: profile.footerTextColor || '#1a1a1a',
            isDefault: profile.isDefault || false,
        });
        setEditingId(profile._id);
        setIsCreating(false);
        setExpandedSections({ basic: true, legal: true, bank: true, footer: true });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setIsCreating(false);
        setFormData(emptyProfile);
    };

    const handleSave = async () => {
        if (!formData.name?.trim()) {
            toast({ title: "Company name is required", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            const url = editingId
                ? `/api/company-profile/${editingId}`
                : '/api/company-profile';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast({
                    title: editingId ? "✅ Profile Updated" : "✅ Profile Created",
                    description: `"${formData.name}" saved successfully. This will auto-fill in new invoices & quotations.`,
                });
                cancelEdit();
                fetchProfiles();
            } else {
                const err = await res.json();
                toast({ title: "Failed to save", description: err.error || 'Unknown error', variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error saving profile", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete company profile "${name}"? This cannot be undone.`)) return;

        try {
            const res = await fetch(`/api/company-profile/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast({ title: "Profile deleted", description: `"${name}" has been removed.` });
                fetchProfiles();
            }
        } catch (error) {
            toast({ title: "Error deleting profile", variant: "destructive" });
        }
    };

    const handleSetDefault = async (profile: CompanyProfile) => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/company-profile/${profile._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...profile, isDefault: true }),
            });
            if (res.ok) {
                toast({ title: "✅ Default Updated", description: `"${profile.name}" is now the default company profile.` });
                fetchProfiles();
            }
        } catch (error) {
            toast({ title: "Error setting default", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </main>
                <Footer />
            </div>
        );
    }

    if (!user) return null;

    const SectionHeader = ({ title, icon: Icon, section, color }: { title: string; icon: any; section: string; color: string }) => (
        <button
            onClick={() => toggleSection(section)}
            className={`w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors`}
        >
            <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="font-semibold text-sm">{title}</span>
            </div>
            {expandedSections[section] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
    );

    const renderForm = () => (
        <Card className="border-2 border-primary/30">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    {editingId ? 'Edit Company Profile' : 'New Company Profile'}
                </CardTitle>
                <CardDescription>
                    {editingId ? 'Update details — changes sync to future invoices & quotations.' : 'Add your company details once. Auto-fills in all invoices & quotations.'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Basic Details */}
                <SectionHeader title="Basic Details" icon={Building2} section="basic" color="text-cyan-500" />
                {expandedSections.basic && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2">
                        <div className="md:col-span-2">
                            <Label>Company Name <span className="text-red-500">*</span></Label>
                            <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Your Company Name" />
                        </div>
                        <div className="md:col-span-2">
                            <Label>Address Line 1</Label>
                            <Input value={formData.address1} onChange={e => setFormData({ ...formData, address1: e.target.value })} placeholder="Street / Building" />
                        </div>
                        <div className="md:col-span-2">
                            <Label>Address Line 2</Label>
                            <Input value={formData.address2} onChange={e => setFormData({ ...formData, address2: e.target.value })} placeholder="City, State, Pincode" />
                        </div>
                        <div>
                            <Label>Phone</Label>
                            <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
                        </div>
                        <div>
                            <Label>Email</Label>
                            <Input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="company@example.com" />
                        </div>
                        <div>
                            <Label>Website</Label>
                            <Input value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} placeholder="https://example.com" />
                        </div>
                        <div>
                            <Label>State Code</Label>
                            <Input value={formData.stateCode} onChange={e => setFormData({ ...formData, stateCode: e.target.value })} placeholder="27" />
                        </div>
                        <div className="md:col-span-2 flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isDefault"
                                checked={formData.isDefault || false}
                                onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300"
                            />
                            <Label htmlFor="isDefault" className="cursor-pointer">Set as Default Profile (auto-fills in new invoices & quotations)</Label>
                        </div>
                        {/* Company Logo Upload */}
                        <div className="md:col-span-2">
                            <Label>Company Logo</Label>
                            <div className="flex items-center gap-3 mt-1">
                                {isUploadingLogo ? (
                                    <div className="w-16 h-16 border rounded flex flex-col items-center justify-center bg-muted animate-pulse">
                                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                        <span className="text-[10px] text-muted-foreground mt-1">Uploading...</span>
                                    </div>
                                ) : formData.logo ? (
                                    <img src={formData.logo} alt="Logo" className="w-16 h-16 object-contain border rounded" />
                                ) : (
                                    <div className="w-16 h-16 border rounded flex items-center justify-center bg-muted">
                                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                )}
                                <label className={`cursor-pointer ${isUploadingLogo ? 'pointer-events-none opacity-50' : ''}`}>
                                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={isUploadingLogo} />
                                    <Button variant="outline" size="sm" asChild disabled={isUploadingLogo}>
                                        <span>
                                            {isUploadingLogo ? (
                                                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Uploading...</>
                                            ) : (
                                                <><Upload className="w-4 h-4 mr-1" /> Upload Logo</>
                                            )}
                                        </span>
                                    </Button>
                                </label>
                                {formData.logo && !isUploadingLogo && (
                                    <Button variant="outline" size="sm" onClick={() => setFormData({ ...formData, logo: '' })}>
                                        <Trash2 className="w-4 h-4 mr-1" /> Remove
                                    </Button>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Logo appears on invoices & quotations. Stored securely in the cloud.</p>
                        </div>
                    </div>
                )}

                {/* Legal & Statutory */}
                <SectionHeader title="Legal & Statutory Details" icon={Shield} section="legal" color="text-emerald-500" />
                {expandedSections.legal && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2">
                        <div>
                            <Label>GSTIN</Label>
                            <Input value={formData.gstin} onChange={e => setFormData({ ...formData, gstin: e.target.value })} placeholder="22AAAAA0000A1Z5" />
                        </div>
                        <div>
                            <Label>PAN</Label>
                            <Input value={formData.pan} onChange={e => setFormData({ ...formData, pan: e.target.value })} placeholder="AAAAA0000A" />
                        </div>
                        <div>
                            <Label>CIN (Corporate Identification Number)</Label>
                            <Input value={formData.cin} onChange={e => setFormData({ ...formData, cin: e.target.value })} placeholder="U12345MH2020PTC000000" />
                        </div>
                        <div>
                            <Label>TAN (Tax Deduction Account Number)</Label>
                            <Input value={formData.tan} onChange={e => setFormData({ ...formData, tan: e.target.value })} placeholder="MUMA00000A" />
                        </div>
                        <div>
                            <Label>MSME / Udyam Registration No.</Label>
                            <Input value={formData.msmeNumber} onChange={e => setFormData({ ...formData, msmeNumber: e.target.value })} placeholder="UDYAM-MH-00-0000000" />
                        </div>
                        <div>
                            <Label>MSME Category</Label>
                            <Select value={formData.msmeCategory || ''} onValueChange={val => setFormData({ ...formData, msmeCategory: val })}>
                                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Micro">Micro</SelectItem>
                                    <SelectItem value="Small">Small</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Date of Incorporation</Label>
                            <Input type="date" value={formData.incorporationDate || ''} onChange={e => setFormData({ ...formData, incorporationDate: e.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                            <p className="text-xs text-muted-foreground">
                                GSTIN, PAN & CIN are printed on every invoice/quotation automatically. TAN is used for TDS. MSME number gives you faster payment rights under law.
                            </p>
                        </div>
                    </div>
                )}

                {/* Bank Details */}
                <SectionHeader title="Bank Details" icon={Banknote} section="bank" color="text-orange-500" />
                {expandedSections.bank && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2">
                        <div className="md:col-span-2">
                            <Label>Bank Name</Label>
                            <Input value={formData.bankName} onChange={e => setFormData({ ...formData, bankName: e.target.value })} placeholder="State Bank of India" />
                        </div>
                        <div>
                            <Label>Account Number</Label>
                            <Input value={formData.bankAccountNo} onChange={e => setFormData({ ...formData, bankAccountNo: e.target.value })} placeholder="00000000000000" />
                        </div>
                        <div>
                            <Label>IFSC Code</Label>
                            <Input value={formData.bankIFSC} onChange={e => setFormData({ ...formData, bankIFSC: e.target.value })} placeholder="SBIN0000000" />
                        </div>
                        <div className="md:col-span-2">
                            <Label>Branch</Label>
                            <Input value={formData.bankBranch} onChange={e => setFormData({ ...formData, bankBranch: e.target.value })} placeholder="Main Branch, Mumbai" />
                        </div>
                    </div>
                )}

                {/* Signature & Footer */}
                <SectionHeader title="Signature & Footer" icon={FileText} section="footer" color="text-purple-500" />
                {expandedSections.footer && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2">
                        <div>
                            <Label>Authorized Signatory Name</Label>
                            <Input value={formData.authorizedSignatory} onChange={e => setFormData({ ...formData, authorizedSignatory: e.target.value })} placeholder="Mr. John Doe" />
                        </div>
                        <div>
                            <Label>Signatory Designation</Label>
                            <Input value={formData.signatoryDesignation} onChange={e => setFormData({ ...formData, signatoryDesignation: e.target.value })} placeholder="Director" />
                        </div>
                        <div className="md:col-span-2">
                            <Label>Footer Line 1</Label>
                            <Input value={formData.footerLine1} onChange={e => setFormData({ ...formData, footerLine1: e.target.value })} placeholder="Your Products | Your Services" />
                        </div>
                        <div className="md:col-span-2">
                            <Label>Footer Line 2</Label>
                            <Input value={formData.footerLine2} onChange={e => setFormData({ ...formData, footerLine2: e.target.value })} placeholder="Additional info line" />
                        </div>
                        <div className="md:col-span-2">
                            <Label>Footer Line 3</Label>
                            <Input value={formData.footerLine3} onChange={e => setFormData({ ...formData, footerLine3: e.target.value })} placeholder="Contact line" />
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                    <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {editingId ? 'Update Profile' : 'Save Profile'}
                    </Button>
                    <Button variant="outline" onClick={cancelEdit}>
                        <X className="w-4 h-4 mr-2" /> Cancel
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    const renderProfileCard = (profile: CompanyProfile) => (
        <Card key={profile._id} className={`relative ${profile.isDefault ? 'border-primary/50 bg-primary/5' : ''}`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                        {profile.logo ? (
                            <img src={profile.logo} alt="" className="w-10 h-10 object-contain border rounded shrink-0" />
                        ) : (
                            <div className="w-10 h-10 border rounded flex items-center justify-center bg-muted shrink-0">
                                <Building2 className="w-5 h-5 text-muted-foreground" />
                            </div>
                        )}
                        <div className="flex-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                                {profile.name}
                                {profile.isDefault && (
                                    <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 text-[10px]">
                                        <Star className="w-3 h-3 mr-1" /> Default
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription className="mt-1">
                                {[profile.address1, profile.address2].filter(Boolean).join(', ') || 'No address set'}
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        {!profile.isDefault && (
                            <Button variant="ghost" size="sm" onClick={() => handleSetDefault(profile)} title="Set as default">
                                <Star className="w-4 h-4" />
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => startEdit(profile)}>
                            <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(profile._id, profile.name)} className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    {profile.phone && (
                        <div>
                            <span className="text-muted-foreground text-xs block">Phone</span>
                            <span>{profile.phone}</span>
                        </div>
                    )}
                    {profile.email && (
                        <div>
                            <span className="text-muted-foreground text-xs block">Email</span>
                            <span className="break-all">{profile.email}</span>
                        </div>
                    )}
                    {profile.gstin && (
                        <div>
                            <span className="text-muted-foreground text-xs block">GSTIN</span>
                            <span className="font-mono text-xs">{profile.gstin}</span>
                        </div>
                    )}
                    {profile.pan && (
                        <div>
                            <span className="text-muted-foreground text-xs block">PAN</span>
                            <span className="font-mono text-xs">{profile.pan}</span>
                        </div>
                    )}
                    {profile.cin && (
                        <div>
                            <span className="text-muted-foreground text-xs block">CIN</span>
                            <span className="font-mono text-xs break-all">{profile.cin}</span>
                        </div>
                    )}
                    {profile.tan && (
                        <div>
                            <span className="text-muted-foreground text-xs block">TAN</span>
                            <span className="font-mono text-xs">{profile.tan}</span>
                        </div>
                    )}
                    {profile.msmeNumber && (
                        <div>
                            <span className="text-muted-foreground text-xs block">MSME / Udyam</span>
                            <span className="font-mono text-xs break-all">{profile.msmeNumber}</span>
                        </div>
                    )}
                    {profile.stateCode && (
                        <div>
                            <span className="text-muted-foreground text-xs block">State Code</span>
                            <span>{profile.stateCode}</span>
                        </div>
                    )}
                    {profile.bankName && (
                        <div>
                            <span className="text-muted-foreground text-xs block">Bank</span>
                            <span>{profile.bankName}</span>
                        </div>
                    )}
                    {profile.bankAccountNo && (
                        <div>
                            <span className="text-muted-foreground text-xs block">Account No.</span>
                            <span className="font-mono text-xs">{profile.bankAccountNo}</span>
                        </div>
                    )}
                    {profile.bankIFSC && (
                        <div>
                            <span className="text-muted-foreground text-xs block">IFSC</span>
                            <span className="font-mono text-xs">{profile.bankIFSC}</span>
                        </div>
                    )}
                    {profile.authorizedSignatory && (
                        <div>
                            <span className="text-muted-foreground text-xs block">Signatory</span>
                            <span>{profile.authorizedSignatory}</span>
                        </div>
                    )}
                </div>
                {profile.updatedAt && (
                    <p className="text-xs text-muted-foreground mt-3 pt-2 border-t">
                        Last updated: {new Date(profile.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                )}

                {/* DigiVault Toggle Button */}
                <button
                    onClick={() => toggleVault(profile._id)}
                    className="w-full mt-4 flex items-center justify-between p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 hover:bg-amber-500/10 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-medium">Legal & Statutory DigiVault</span>
                        <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-600">Secure Storage</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-muted-foreground" />
                        {expandedVaults[profile._id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                </button>

                {/* Per-Company DigiVault */}
                {expandedVaults[profile._id] && (
                    <div className="mt-3">
                        <LegalDocumentStore
                            companyProfileId={profile._id}
                            companyName={profile.name}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );

    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">
                <section className="py-8 lg:py-12">
                    <div className="container px-4 md:px-6">
                        <div className="max-w-4xl mx-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <Link href="/profile">
                                        <Button variant="ghost" size="sm">
                                            <ArrowLeft className="w-4 h-4 mr-1" /> Profile
                                        </Button>
                                    </Link>
                                    <div>
                                        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                                            <Building2 className="w-7 h-7 text-primary" />
                                            Company Profiles
                                        </h1>
                                        <p className="text-muted-foreground text-sm mt-1">
                                            Manage your company details — auto-fills in invoices, quotations & emails.
                                        </p>
                                    </div>
                                </div>
                                {!isCreating && !editingId && (
                                    <Button onClick={startCreate}>
                                        <Plus className="w-4 h-4 mr-2" /> Add Company
                                    </Button>
                                )}
                            </div>

                            {/* Form (Create/Edit) */}
                            {(isCreating || editingId) && renderForm()}

                            {/* Info Banner */}
                            {!isCreating && !editingId && profiles.length === 0 && !isLoading && (
                                <Card className="mb-6 bg-primary/5 border-primary/20">
                                    <CardContent className="p-6 text-center">
                                        <Building2 className="w-12 h-12 text-primary mx-auto mb-3 opacity-50" />
                                        <h3 className="font-semibold text-lg mb-2">No Company Profiles Yet</h3>
                                        <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
                                            Add your first company profile with all legal & statutory details.
                                            It will auto-fill in every invoice and quotation you create.
                                        </p>
                                        <Button onClick={startCreate}>
                                            <Plus className="w-4 h-4 mr-2" /> Create First Profile
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Sync Info */}
                            {profiles.length > 0 && !isCreating && !editingId && (
                                <Card className="mb-6 bg-emerald-500/5 border-emerald-500/20">
                                    <CardContent className="p-4 flex items-start gap-3">
                                        <Check className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                                        <div className="text-sm">
                                            <span className="font-semibold text-emerald-500">Synced Everywhere</span>
                                            <span className="text-muted-foreground"> — Your default profile auto-fills when you create a new invoice or quotation. You can also switch profiles from the invoice/quotation editor.</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Loading */}
                            {isLoading && (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            )}

                            {/* Profile Cards */}
                            {!isLoading && !isCreating && !editingId && (
                                <div className="space-y-4">
                                    {profiles.map(renderProfileCard)}
                                </div>
                            )}


                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
