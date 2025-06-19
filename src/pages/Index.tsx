
import React, { useState, useCallback } from 'react';
import { Upload, Download, Copy, FileImage, Languages, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Tesseract from 'tesseract.js';

const Index = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState('eng');
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const languages = [
    { code: 'eng', name: 'English' },
    { code: 'hin', name: 'Hindi' },
    { code: 'spa', name: 'Spanish' },
    { code: 'fra', name: 'French' },
    { code: 'deu', name: 'German' },
    { code: 'ara', name: 'Arabic' },
    { code: 'chi_sim', name: 'Chinese (Simplified)' },
    { code: 'jpn', name: 'Japanese' },
  ];

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    
    if (!validTypes.includes(selectedFile.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload JPG, PNG, or PDF files only.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload files smaller than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    setExtractedText('');
    
    toast({
      title: 'File uploaded successfully',
      description: 'Ready to extract text. Click "Extract Text" to begin.',
    });
  };

  const extractText = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setExtractedText('');

    try {
      const result = await Tesseract.recognize(file, language, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      setExtractedText(result.data.text);
      toast({
        title: 'Text extracted successfully!',
        description: 'You can now edit, copy, or download the text.',
      });
    } catch (error) {
      console.error('OCR Error:', error);
      toast({
        title: 'Extraction failed',
        description: 'There was an error processing your image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const copyToClipboard = async () => {
    if (!extractedText) return;
    
    try {
      await navigator.clipboard.writeText(extractedText);
      toast({
        title: 'Text copied!',
        description: 'The extracted text has been copied to your clipboard.',
      });
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Unable to copy text to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const downloadText = () => {
    if (!extractedText) return;
    
    const blob = new Blob([extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted-text-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Download started',
      description: 'Your text file is being downloaded.',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <FileImage className="text-blue-600" />
            OCR Text Extractor
          </h1>
          <p className="text-gray-600 text-lg">
            Convert images and PDFs to editable text with AI-powered OCR
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            {/* Language Selection */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Languages className="text-blue-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-800">Language</h3>
              </div>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Drag and Drop Area */}
            <div
              className={`relative bg-white rounded-xl shadow-sm border-2 border-dashed transition-all duration-300 ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Drop your files here
                </h3>
                <p className="text-gray-500 mb-4">
                  Support JPG, PNG, and PDF files up to 10MB
                </p>
                <input
                  type="file"
                  onChange={handleFileInput}
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button asChild className="cursor-pointer">
                    <span>Choose File</span>
                  </Button>
                </label>
              </div>
            </div>

            {/* Preview Section */}
            {previewUrl && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Preview</h3>
                <div className="relative">
                  {file?.type === 'application/pdf' ? (
                    <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
                      <div className="text-center">
                        <FileImage className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-gray-600">PDF: {file.name}</p>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full max-h-48 object-contain rounded-lg bg-gray-100"
                    />
                  )}
                </div>
                <div className="mt-4 flex justify-center">
                  <Button 
                    onClick={extractText} 
                    disabled={isProcessing}
                    className="w-full sm:w-auto"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Extracting... {progress}%
                      </>
                    ) : (
                      'Extract Text'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Extracted Text</h3>
                {extractedText && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      className="flex items-center gap-2"
                    >
                      <Copy size={16} />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadText}
                      className="flex items-center gap-2"
                    >
                      <Download size={16} />
                      Download
                    </Button>
                  </div>
                )}
              </div>
              
              <Textarea
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                placeholder="Extracted text will appear here..."
                className="min-h-[400px] resize-none"
                disabled={isProcessing}
              />
              
              {extractedText && (
                <div className="mt-4 text-sm text-gray-500">
                  {extractedText.split(/\s+/).length} words, {extractedText.length} characters
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Upload className="text-blue-600" size={24} />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Easy Upload</h3>
            <p className="text-gray-600 text-sm">
              Simply drag and drop or click to upload your images and PDFs
            </p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Languages className="text-green-600" size={24} />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Multi-Language</h3>
            <p className="text-gray-600 text-sm">
              Support for English, Hindi, Spanish, and many more languages
            </p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileImage className="text-purple-600" size={24} />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">High Accuracy</h3>
            <p className="text-gray-600 text-sm">
              AI-powered OCR technology for accurate text extraction
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
