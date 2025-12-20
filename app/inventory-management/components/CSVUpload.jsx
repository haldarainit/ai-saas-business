'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, AlertCircle, CheckCircle, XCircle, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';

export default function CSVUpload({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    // Validate file type
    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a CSV file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload a file smaller than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/inventory/upload-csv', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Upload failed');
      }

      setUploadResult(result);
      
      // Show success toast
      toast({
        title: 'Upload Successful',
        description: `Successfully uploaded ${result.summary.successful} products.`,
      });

      // Call success callback if provided
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        message: error.message,
        summary: { successful: 0, errors: 1 },
        error: true
      });
      
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload CSV file.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `name,sku,description,category,price,cost,quantity,shelf,expiryDate,supplier
Sample Product,SKU001,Sample description,Electronics,29.99,15.99,50,A1,2024-12-31,Sample Supplier
Another Product,SKU002,Another description,Books,19.99,10.99,25,B2,2024-06-30,Book Publisher`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload CSV File
        </CardTitle>
        <CardDescription>
          Upload multiple products at once using a CSV file. Download the template below for the correct format.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Download Template Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download CSV Template
          </Button>
        </div>

        {/* File Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            disabled={uploading}
          />
          
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">
            {uploading ? 'Uploading...' : 'Drop your CSV file here or click to browse'}
          </p>
          <p className="text-sm text-muted-foreground">
            Maximum file size: 10MB. Only CSV files are accepted.
          </p>
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Upload Results */}
        {uploadResult && !uploadResult.error && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Upload Completed</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {uploadResult.summary.successful}
                </div>
                <div className="text-green-700 dark:text-green-300">Successful</div>
              </div>
              
              <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                  {uploadResult.summary.duplicates}
                </div>
                <div className="text-amber-700 dark:text-amber-300">Duplicates</div>
              </div>
              
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-lg font-bold text-red-600 dark:text-red-400">
                  {uploadResult.summary.errors}
                </div>
                <div className="text-red-700 dark:text-red-300">Errors</div>
              </div>
              
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {uploadResult.summary.total}
                </div>
                <div className="text-blue-700 dark:text-blue-300">Total</div>
              </div>
            </div>

            {/* Error Details */}
            {(uploadResult.results?.errors?.length > 0 || uploadResult.validationErrors?.length > 0) && (
              <div className="mt-4">
                <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Errors & Warnings
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-1 text-sm">
                  {uploadResult.validationErrors?.map((error, index) => (
                    <div key={`validation-${index}`} className="text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                      Row {error.row}: {error.error}
                    </div>
                  ))}
                  {uploadResult.results?.errors?.map((error, index) => (
                    <div key={`error-${index}`} className="text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                      {error.sku}: {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Duplicate Details */}
            {uploadResult.results?.duplicates?.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-amber-600 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Duplicate SKUs (Skipped)
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-1 text-sm">
                  {uploadResult.results.duplicates.map((duplicate, index) => (
                    <div key={`duplicate-${index}`} className="text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                      {duplicate.sku}: {duplicate.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {uploadResult?.error && (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            <span>{uploadResult.message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
