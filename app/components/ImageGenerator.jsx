"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Wand2,
  ArrowLeft,
  Loader2,
  Download,
  Image as ImageIcon,
} from "lucide-react";
// Dynamic import will be used in the component

export default function ImageGenerator({ onBack }) {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisResult, setAnalysisResult] = useState("");
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeAndGenerate = async () => {
    if (!uploadedImage || !prompt) return;

    try {
      setIsAnalyzing(true);
      setAnalysisResult("");

      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result.split(",")[1];
          const mimeType = uploadedImage.type || "image/jpeg";

          console.log("Analyzing image with MIME type:", mimeType);

          // Analyze the uploaded image
          const geminiModule = await import("../../utils/gemini");
          const gemini = geminiModule.default || geminiModule;
          const analysis = await gemini.analyzeImage(
            base64Data,
            mimeType,
            `Analyze this image in detail. Describe the main elements, colors, style, composition, and any notable features. Then consider how to: ${prompt}`
          );

          console.log("Analysis result:", analysis);
          setAnalysisResult(analysis);
          setIsAnalyzing(false);

          // Only proceed with generation if analysis was successful
          if (!analysis.startsWith("Error analyzing image")) {
            // Generate new image based on analysis and prompt
            setIsGenerating(true);

            try {
              const response = await fetch("/api/generate-image", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  prompt: `Based on this image analysis: ${analysis}. Now create: ${prompt}`,
                }),
              });

              if (response.ok) {
                const blob = await response.blob();
                const imageUrl = URL.createObjectURL(blob);
                setGeneratedImage(imageUrl);
              } else {
                console.error("Image generation failed");
                const errorData = await response.json();
                console.error("Error details:", errorData);
              }
            } catch (error) {
              console.error("Error generating image:", error);
            } finally {
              setIsGenerating(false);
            }
          } else {
            setIsGenerating(false);
          }
        } catch (error) {
          console.error("Error in analysis:", error);
          setAnalysisResult(`Error: ${error.message}`);
          setIsAnalyzing(false);
          setIsGenerating(false);
        }
      };

      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        setAnalysisResult("Error reading image file");
        setIsAnalyzing(false);
      };

      reader.readAsDataURL(uploadedImage);
    } catch (error) {
      console.error("Error:", error);
      setAnalysisResult(`Error: ${error.message}`);
      setIsAnalyzing(false);
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement("a");
      link.href = generatedImage;
      link.download = "generated-image.png";
      link.click();
    }
  };

  const handleReset = () => {
    setUploadedImage(null);
    setImagePreview(null);
    setPrompt("");
    setGeneratedImage(null);
    setAnalysisResult("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 flex items-center justify-center">
      {/* Background Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-gradient-to-br from-purple-400/20 to-pink-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/20 to-cyan-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-start items-center mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#1E40AF] to-[#753AED] hover:from-[#753AED] hover:to-[#1E40AF] text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg transform hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Services
          </button>
        </div>

        {/* Main Content */}
        <div className="w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl font-extrabold mb-4">
              <span className="bg-gradient-to-r from-[#1E40AF] via-[#753AED] to-[#F5900B] bg-clip-text text-transparent">
                AI Image Generator
              </span>
            </h1>
            <p className="text-lg text-gray-600">
              Upload an image and describe what you want to create
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Upload & Input Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-lg border border-gray-200 h-full"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Upload className="w-6 h-6 text-[#753AED]" />
                Upload & Configure
              </h2>

              {/* Image Upload */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Upload Reference Image
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-[#753AED] transition-all bg-gray-50 hover:bg-purple-50"
                >
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-64 mx-auto rounded-lg shadow-md"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReset();
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600 font-medium">
                        Click to upload image
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        PNG, JPG up to 10MB
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Prompt Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Describe What You Want to Create
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g., 'Create a futuristic version of this', 'Make it look like a watercolor painting', 'Add a sunset background'..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#753AED] focus:outline-none bg-white text-gray-900 placeholder:text-gray-400"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleAnalyzeAndGenerate}
                disabled={
                  !uploadedImage || !prompt || isAnalyzing || isGenerating
                }
                className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all ${
                  uploadedImage && prompt && !isAnalyzing && !isGenerating
                    ? "bg-gradient-to-r from-[#1E40AF] via-[#753AED] to-[#F5900B] text-white shadow-lg hover:shadow-xl hover:scale-105"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isAnalyzing || isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isAnalyzing ? "Analyzing..." : "Generating..."}
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Generate Image
                  </>
                )}
              </button>
            </motion.div>

            {/* Results Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-lg border border-gray-200 h-full"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Wand2 className="w-6 h-6 text-[#753AED]" />
                Generated Result
              </h2>

              <AnimatePresence mode="wait">
                {generatedImage ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="space-y-4"
                  >
                    <div className="relative rounded-2xl overflow-hidden shadow-lg">
                      <img
                        src={generatedImage}
                        alt="Generated"
                        className="w-full h-auto"
                      />
                    </div>

                    {analysisResult && (
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          Image Analysis:
                        </p>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {analysisResult}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={handleDownload}
                        className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <Download className="w-5 h-5" />
                        Download
                      </button>
                      <button
                        onClick={handleReset}
                        className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                      >
                        Create New
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-full min-h-[400px] text-center"
                  >
                    {isAnalyzing || isGenerating ? (
                      <div className="space-y-4">
                        <Loader2 className="w-16 h-16 text-[#753AED] animate-spin mx-auto" />
                        <p className="text-lg font-semibold text-gray-700">
                          {isAnalyzing
                            ? "Analyzing your image..."
                            : "Generating your image..."}
                        </p>
                        <p className="text-sm text-gray-500">
                          This may take a few moments
                        </p>
                      </div>
                    ) : analysisResult && analysisResult.startsWith("Error") ? (
                      <div className="space-y-4 w-full">
                        <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto">
                          <ImageIcon className="w-12 h-12 text-red-500" />
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                          <p className="text-sm font-semibold text-red-700 mb-2">
                            Analysis Error:
                          </p>
                          <p className="text-sm text-red-600 leading-relaxed">
                            {analysisResult}
                          </p>
                        </div>
                        <button
                          onClick={handleReset}
                          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                        >
                          Try Again
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto">
                          <ImageIcon className="w-12 h-12 text-[#753AED]" />
                        </div>
                        <p className="text-gray-500">
                          Upload an image and enter a prompt to generate
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
