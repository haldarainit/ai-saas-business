"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
    FileText,
    Upload,
    Trash2,
    Download,
    Search,
    FolderOpen,
    Shield,
    Loader2,
    Eye,
    Plus,
    Filter,
    Lock,
    CheckCircle2,
    XCircle,
    Clock,
    FileImage,
    File,
    FileBadge,
    Landmark,
    BookOpen,
    ScrollText,
    Award,
    Building2,
    ReceiptText,
    Users,
    X,
} from "lucide-react";

// Document categories
const DOCUMENT_CATEGORIES = [
    { value: "certificate_of_incorporation", label: "Certificate of Incorporation", description: "Official proof of company formation issued by MCA", icon: FileBadge, color: "text-blue-500", bg: "bg-blue-500/10" },
    { value: "pan_card", label: "PAN Card", description: "Tax identification for income tax compliance", icon: ReceiptText, color: "text-red-500", bg: "bg-red-500/10" },
    { value: "tan_card", label: "TAN Certificate", description: "Tax Deduction Account Number for TDS compliance", icon: ReceiptText, color: "text-orange-500", bg: "bg-orange-500/10" },
    { value: "moa", label: "Memorandum of Association (MOA)", description: "Defines company objectives and structure", icon: ScrollText, color: "text-purple-500", bg: "bg-purple-500/10" },
    { value: "aoa", label: "Articles of Association (AOA)", description: "Defines operational rules and regulations", icon: BookOpen, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { value: "cin_details", label: "CIN Details", description: "Corporate Identification Number issued by ROC", icon: Building2, color: "text-teal-500", bg: "bg-teal-500/10" },
    { value: "gst_certificate", label: "GST Registration Certificate", description: "Confirms GST compliance and tax registration", icon: Landmark, color: "text-green-500", bg: "bg-green-500/10" },
    { value: "msme_udyam", label: "MSME / Udyam Registration", description: "Recognition for MSME benefits", icon: Award, color: "text-amber-500", bg: "bg-amber-500/10" },
    { value: "statutory_register", label: "Statutory Register", description: "Registers of Members, Directors, Shares, Loans & Investments", icon: Users, color: "text-cyan-500", bg: "bg-cyan-500/10" },
    { value: "minutes_book", label: "Minutes Book", description: "Records of Board Meetings and AGM decisions", icon: BookOpen, color: "text-pink-500", bg: "bg-pink-500/10" },
    { value: "other", label: "Other Document", description: "Any other legal or statutory document", icon: FileText, color: "text-gray-500", bg: "bg-gray-500/10" },
];

interface LegalDoc {
    _id: string;
    category: string;
    documentName: string;
    description?: string;
    fileUrl: string;
    publicId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
}

interface LegalDocumentStoreProps {
    companyProfileId?: string;
    companyName?: string;
}

export default function LegalDocumentStore({ companyProfileId, companyName }: LegalDocumentStoreProps) {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [documents, setDocuments] = useState<LegalDoc[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Upload form state
    const [uploadCategory, setUploadCategory] = useState<string>("");
    const [uploadDocName, setUploadDocName] = useState("");
    const [uploadDescription, setUploadDescription] = useState("");
    const [uploadFile, setUploadFile] = useState<File | null>(null);

    // Fetch documents
    const fetchDocuments = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (companyProfileId) params.set("companyProfileId", companyProfileId);
            const res = await fetch(`/api/legal-documents?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setDocuments(data.documents || []);
            }
        } catch (error) {
            console.error("Error fetching legal documents:", error);
        } finally {
            setIsLoading(false);
        }
    }, [companyProfileId]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    // Upload document
    const handleUpload = async () => {
        if (!uploadFile || !uploadCategory || !uploadDocName.trim()) {
            toast({ title: "Please fill all required fields", variant: "destructive" });
            return;
        }

        setIsUploading(true);
        setUploadProgress(10);

        try {
            const fd = new FormData();
            fd.append("file", uploadFile);
            fd.append("category", uploadCategory);
            fd.append("documentName", uploadDocName.trim());
            if (uploadDescription) fd.append("description", uploadDescription.trim());
            if (companyProfileId) fd.append("companyProfileId", companyProfileId);

            setUploadProgress(30);

            const res = await fetch("/api/legal-documents", {
                method: "POST",
                body: fd,
            });

            setUploadProgress(80);

            if (res.ok) {
                const data = await res.json();
                toast({ title: "✅ Document Uploaded", description: `"${uploadDocName}" stored securely in your DigiVault.` });
                setDocuments(prev => [data.document, ...prev]);
                resetUploadForm();
                setIsUploadDialogOpen(false);
            } else {
                const err = await res.json();
                toast({ title: "Upload Failed", description: err.error || "Unknown error", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Upload Error", variant: "destructive" });
        } finally {
            setIsUploading(false);
            setUploadProgress(100);
            setTimeout(() => setUploadProgress(0), 500);
        }
    };

    // Delete document
    const handleDelete = async (doc: LegalDoc) => {
        if (!confirm(`Delete "${doc.documentName}"? This cannot be undone.`)) return;

        setDeletingId(doc._id);
        try {
            const res = await fetch(`/api/legal-documents?id=${doc._id}`, { method: "DELETE" });
            if (res.ok) {
                toast({ title: "Document Deleted", description: `"${doc.documentName}" removed.` });
                setDocuments(prev => prev.filter(d => d._id !== doc._id));
            } else {
                toast({ title: "Delete Failed", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Delete Error", variant: "destructive" });
        } finally {
            setDeletingId(null);
        }
    };

    const resetUploadForm = () => {
        setUploadCategory("");
        setUploadDocName("");
        setUploadDescription("");
        setUploadFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Format file size
    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Get category info
    const getCategoryInfo = (value: string) => DOCUMENT_CATEGORIES.find(c => c.value === value);

    // Filter documents
    const filteredDocs = documents.filter(doc => {
        const matchesSearch = searchQuery === "" ||
            doc.documentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (doc.description || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === "all" || doc.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    // Group by category for overview
    const categoryCounts = DOCUMENT_CATEGORIES.map(cat => ({
        ...cat,
        count: documents.filter(d => d.category === cat.value).length,
    }));

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith("image/")) return <FileImage className="w-5 h-5 text-blue-400" />;
        if (mimeType === "application/pdf") return <FileText className="w-5 h-5 text-red-400" />;
        return <File className="w-5 h-5 text-gray-400" />;
    };

    return (
        <Card className="border-2 border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Lock className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Shield className="w-5 h-5 text-amber-500" />
                                Legal & Statutory DigiVault
                            </CardTitle>
                            <CardDescription>
                                {companyName ? `Secure document store for ${companyName}` : "Upload, store & retrieve your legal documents instantly"}
                            </CardDescription>
                        </div>
                    </div>
                    <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
                                <Plus className="w-4 h-4 mr-1" /> Upload Document
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Upload className="w-5 h-5 text-amber-500" />
                                    Upload Legal Document
                                </DialogTitle>
                                <DialogDescription>
                                    Documents are stored securely in the cloud for instant retrieval. Max 15MB.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                <div>
                                    <Label>Document Category <span className="text-red-500">*</span></Label>
                                    <Select value={uploadCategory} onValueChange={val => {
                                        setUploadCategory(val);
                                        const cat = getCategoryInfo(val);
                                        if (cat && !uploadDocName) setUploadDocName(cat.label);
                                    }}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Select document type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DOCUMENT_CATEGORIES.map(cat => (
                                                <SelectItem key={cat.value} value={cat.value}>
                                                    <div className="flex items-center gap-2">
                                                        <cat.icon className={`w-4 h-4 ${cat.color}`} />
                                                        <span>{cat.label}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {uploadCategory && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {getCategoryInfo(uploadCategory)?.description}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label>Document Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={uploadDocName}
                                        onChange={e => setUploadDocName(e.target.value)}
                                        placeholder="e.g. Certificate of Incorporation 2024"
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label>Description (optional)</Label>
                                    <Input
                                        value={uploadDescription}
                                        onChange={e => setUploadDescription(e.target.value)}
                                        placeholder="Brief note about this document"
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label>File <span className="text-red-500">*</span></Label>
                                    <div className="mt-1 border-2 border-dashed rounded-lg p-4 text-center hover:border-amber-500/50 transition-colors">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt"
                                            onChange={e => setUploadFile(e.target.files?.[0] || null)}
                                            className="hidden"
                                            id="legal-doc-upload"
                                        />
                                        <label htmlFor="legal-doc-upload" className="cursor-pointer">
                                            {uploadFile ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    {getFileIcon(uploadFile.type)}
                                                    <div className="text-left">
                                                        <p className="text-sm font-medium truncate max-w-[250px]">{uploadFile.name}</p>
                                                        <p className="text-xs text-muted-foreground">{formatSize(uploadFile.size)}</p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setUploadFile(null);
                                                            if (fileInputRef.current) fileInputRef.current.value = "";
                                                        }}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                                    <p className="text-sm text-muted-foreground">
                                                        Click to select file (PDF, Image, Word, Excel)
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">Max 15MB</p>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                {isUploading && (
                                    <div className="space-y-1">
                                        <Progress value={uploadProgress} className="h-2" />
                                        <p className="text-xs text-muted-foreground text-center">Uploading securely...</p>
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => { resetUploadForm(); setIsUploadDialogOpen(false); }} disabled={isUploading}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleUpload}
                                    disabled={isUploading || !uploadFile || !uploadCategory || !uploadDocName.trim()}
                                    className="bg-amber-500 hover:bg-amber-600 text-white"
                                >
                                    {isUploading ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                                    ) : (
                                        <><Upload className="w-4 h-4 mr-2" /> Upload & Store</>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Category Quick Overview Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {categoryCounts.map(cat => (
                        <button
                            key={cat.value}
                            onClick={() => setFilterCategory(filterCategory === cat.value ? "all" : cat.value)}
                            className={`relative flex flex-col items-center gap-1 p-3 rounded-lg border text-center transition-all hover:shadow-sm ${
                                filterCategory === cat.value
                                    ? "border-amber-500 bg-amber-500/10 shadow-sm"
                                    : "border-border/50 hover:border-border"
                            }`}
                        >
                            <cat.icon className={`w-5 h-5 ${cat.color}`} />
                            <span className="text-[10px] font-medium leading-tight line-clamp-2">{cat.label}</span>
                            {cat.count > 0 && (
                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 absolute top-1 right-1">
                                    {cat.count}
                                </Badge>
                            )}
                        </button>
                    ))}
                </div>

                {/* Search & Filter Bar */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search documents..."
                            className="pl-9 h-9"
                        />
                    </div>
                    {filterCategory !== "all" && (
                        <Button variant="outline" size="sm" onClick={() => setFilterCategory("all")} className="h-9 text-xs">
                            <X className="w-3 h-3 mr-1" /> Clear Filter
                        </Button>
                    )}
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <FolderOpen className="w-3.5 h-3.5" />
                        {documents.length} document{documents.length !== 1 ? "s" : ""} stored
                    </span>
                    <span className="flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-green-500" />
                        Encrypted cloud storage
                    </span>
                    {filterCategory !== "all" && (
                        <span className="flex items-center gap-1">
                            <Filter className="w-3.5 h-3.5" />
                            Showing: {getCategoryInfo(filterCategory)?.label}
                        </span>
                    )}
                </div>

                {/* Loading */}
                {isLoading && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && documents.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <Lock className="w-10 h-10 mx-auto text-amber-500/50 mb-3" />
                        <h4 className="font-semibold mb-1">No Documents Yet</h4>
                        <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                            Upload your legal & statutory documents for secure storage and instant retrieval. Certificates, PAN, GST, MOA, AOA — all in one place.
                        </p>
                        <Button size="sm" onClick={() => setIsUploadDialogOpen(true)} className="bg-amber-500 hover:bg-amber-600 text-white">
                            <Upload className="w-4 h-4 mr-1" /> Upload First Document
                        </Button>
                    </div>
                )}

                {/* No Results */}
                {!isLoading && documents.length > 0 && filteredDocs.length === 0 && (
                    <div className="text-center py-6">
                        <Search className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">No documents match your search / filter.</p>
                    </div>
                )}

                {/* Document List */}
                {!isLoading && filteredDocs.length > 0 && (
                    <div className="space-y-2">
                        {filteredDocs.map(doc => {
                            const catInfo = getCategoryInfo(doc.category);
                            const CatIcon = catInfo?.icon || FileText;
                            return (
                                <div
                                    key={doc._id}
                                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                                >
                                    {/* Icon */}
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${catInfo?.bg || "bg-gray-500/10"}`}>
                                        <CatIcon className={`w-5 h-5 ${catInfo?.color || "text-gray-500"}`} />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h5 className="text-sm font-medium truncate">{doc.documentName}</h5>
                                            <Badge variant="outline" className="text-[9px] shrink-0">
                                                {catInfo?.label || doc.category}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                                            <span className="truncate max-w-[150px]">{doc.fileName}</span>
                                            <span>•</span>
                                            <span>{formatSize(doc.fileSize)}</span>
                                            <span>•</span>
                                            <span>{new Date(doc.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                                        </div>
                                        {doc.description && (
                                            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{doc.description}</p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                            <Button variant="ghost" size="sm" title="View / Download">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </a>
                                        <a href={doc.fileUrl} download={doc.fileName}>
                                            <Button variant="ghost" size="sm" title="Download">
                                                <Download className="w-4 h-4" />
                                            </Button>
                                        </a>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(doc)}
                                            disabled={deletingId === doc._id}
                                            className="text-destructive hover:text-destructive"
                                            title="Delete"
                                        >
                                            {deletingId === doc._id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Footer tip */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <p>
                        <span className="font-medium text-foreground/80">Secure Cloud Storage</span> — All documents are encrypted and stored via Cloudinary. 
                        Only you can access your documents. Supports PDF, images, Word & Excel files up to 15MB.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
