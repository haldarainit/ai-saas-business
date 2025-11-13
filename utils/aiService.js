import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const API_KEY = 'AIzaSyBzOVJM4eScyJSjEsBpb7BQowTq1jgGfas';
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Analyze an image and generate a new one based on the prompt
 * @param {string} base64Image - Base64 encoded image
 * @param {string} prompt - Description of what to create
 * @param {string} outputPath - Optional path to save the generated image
 * @returns {Promise<{analysis: string, generatedImagePath: string}>}
 */
export async function analyzeAndGenerate(base64Image, prompt, outputPath = "generated_image.png") {
  try {
    // Step 1: Analyze the image
    console.log('Step 1: Analyzing image...');
    const analysis = await analyzeImageFromBase64(base64Image, prompt);
    console.log('Analysis complete!');

    // Step 2: Generate new image based on analysis
    console.log('Step 2: Generating new image...');
    const generatedImagePath = await generateImageFromPrompt(
      `Based on this image analysis: ${analysis}. Now create: ${prompt}`,
      outputPath
    );
    console.log('Image generation complete!');

    return {
      analysis,
      generatedImagePath
    };
  } catch (error) {
    console.error('Error in analyzeAndGenerate:', error);
    throw error;
  }
}

/**
 * Analyze an image using Gemini Vision
 * @param {string} base64Image - Base64 encoded image
 * @param {string} customPrompt - Custom analysis prompt
 * @returns {Promise<string>} - Analysis result
 */
async function analyzeImageFromBase64(base64Image, customPrompt = "") {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    });

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: "image/jpeg",
      },
    };

    const prompt = customPrompt 
      ? `Analyze this image in detail. Describe the main elements, colors, style, composition, and any notable features. Context: ${customPrompt}`
      : "Analyze this image in detail. Describe the main elements, colors, style, composition, and any notable features.";

    const result = await model.generateContent([imagePart, prompt]);
    const response = await result.response;
    const text = response.text();

    if (!text || text.trim() === '') {
      throw new Error('Empty response from API');
    }

    return text;
  } catch (error) {
    console.error('Image analysis error:', error);
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}

/**
 * Generate an image from a text prompt using Pollinations.ai
 * @param {string} prompt - Text description of the image to generate
 * @param {string} outputPath - Path where to save the generated image
 * @returns {Promise<string>} - Path to the generated image
 */
async function generateImageFromPrompt(prompt, outputPath = "generated_image.png") {
  try {
    // Using Pollinations.ai free API for image generation
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;

    console.log('Fetching generated image from:', imageUrl);

    // Fetch the image
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to generate image: ${response.statusText}`);
    }

    // Get the image as array buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save the image
    fs.writeFileSync(outputPath, buffer);
    console.log(`Image saved to: ${outputPath}`);

    return outputPath;
  } catch (error) {
    console.error('Image generation error:', error);
    throw new Error(`Failed to generate image: ${error.message}`);
  }
}

/**
 * Analyze an image from a file path
 * @param {string} filePath - Path to the image file
 * @param {string} prompt - Analysis prompt
 * @returns {Promise<string>} - Analysis result
 */
export async function analyzeImageFromFile(filePath, prompt = "Describe this image in detail") {
  try {
    const base64Image = fs.readFileSync(filePath).toString("base64");
    return await analyzeImageFromBase64(base64Image, prompt);
  } catch (error) {
    console.error('Error analyzing image from file:', error);
    throw error;
  }
}

/**
 * Generate an image and save it to a file
 * @param {string} prompt - Text description
 * @param {string} outputPath - Where to save the image
 * @returns {Promise<string>} - Path to saved image
 */
export async function generateImage(prompt, outputPath = "generated_image.png") {
  return await generateImageFromPrompt(prompt, outputPath);
}
