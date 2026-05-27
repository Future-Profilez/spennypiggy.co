import React, { useState } from 'react';
import { generateSupportSocialImage } from '../utils/generateSupportSocialImage.js';

/**
 * Demo component to test support social image generation
 * This can be temporarily added to any page for testing
 */
export default function SupportImageDemo() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState(null);
    const [error, setError] = useState(null);

    const testPayload = {
        creator: {
            name: 'Demo Creator',
            username: 'democreator',
            // Use a real Uploadcare UUID if you have one, or this will fail
            avatar: '12345678-1234-1234-1234-123456789abc' // Replace with real UUID
        },
        supporterName: 'Demo Supporter',
        amount: 25.50,
        currency: 'GBP',
        isAnonymous: false,
        message: 'Thank you for the amazing content! 🎉'
    };

    const handleGenerateImage = async () => {
        setIsGenerating(true);
        setError(null);
        setGeneratedImage(null);

        try {
            
            const imageFile = await generateSupportSocialImage(testPayload);
            
            // Create URL for preview
            const imageUrl = URL.createObjectURL(imageFile);
            setGeneratedImage({
                url: imageUrl,
                file: imageFile,
                filename: imageFile.name
            });

        } catch (err) {
            console.error('❌ Image generation failed:', err);
            setError(err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const downloadImage = () => {
        if (!generatedImage) return;
        
        const link = document.createElement('a');
        link.href = generatedImage.url;
        link.download = generatedImage.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className=\"bg-white rounded-[30px]    shadow-lg p-6 max-w-2xl mx-auto my-8\">
            <h2 className=\"text-2xl font-bold mb-4 text-center text-gray-800\">
                🎨 Support Social Image Generator Demo
            </h2>
            
            <div className=\"mb-6 p-4 bg-gray-50 rounded-[30px]   \">
                <h3 className=\"font-semibold mb-2\">Test Payload:</h3>
                <pre className=\"text-sm text-gray-600 whitespace-pre-wrap\">
                    {JSON.stringify(testPayload, null, 2)}
                </pre>
            </div>

            <div className=\"flex gap-4 mb-6\">
                <button
                    onClick={handleGenerateImage}
                    disabled={isGenerating}
                    className={`flex-1 py-3 px-6 rounded-[30px]    font-semibold transition-colors ${\n                        isGenerating \n                            ? 'bg-gray-400 text-gray-700 cursor-not-allowed'\n                            : 'bg-blue-500 hover:bg-blue-600 text-white'\n                    }`}\n                >\n                    {isGenerating ? '🔄 Generating...' : '🎨 Generate Support Image'}\n                </button>\n                \n                {generatedImage && (\n                    <button\n                        onClick={downloadImage}\n                        className=\"py-3 px-6 bg-green-500 hover:bg-green-600 text-white rounded-[30px]    font-semibold transition-colors\"\n                    >\n                        📥 Download\n                    </button>\n                )}\n            </div>\n\n            {error && (\n                <div className=\"mb-4 p-4 bg-red-100 border border-red-300 rounded-[30px]   \">\n                    <h4 className=\"font-semibold text-red-800 mb-2\">❌ Error:</h4>\n                    <p className=\"text-red-700\">{error}</p>\n                    <p className=\"text-sm text-red-600 mt-2\">\n                        💡 Make sure to replace the demo avatar UUID with a real one from your Uploadcare account.\n                    </p>\n                </div>\n            )}\n\n            {generatedImage && (\n                <div className=\"space-y-4\">\n                    <div className=\"bg-green-100 border border-green-300 rounded-[30px]    p-4\">\n                        <h4 className=\"font-semibold text-green-800 mb-2\">✅ Success!</h4>\n                        <p className=\"text-green-700\">\n                            Generated: <code>{generatedImage.filename}</code> \n                            ({(generatedImage.file.size / 1024).toFixed(1)}KB)\n                        </p>\n                    </div>\n                    \n                    <div className=\"border-2 border-gray-200 rounded-[30px]    p-4 bg-gray-50\">\n                        <h4 className=\"font-semibold mb-3 text-center\">Preview:</h4>\n                        <div className=\"flex justify-center\">\n                            <img \n                                src={generatedImage.url} \n                                alt=\"Generated Support Social Image\" \n                                className=\"max-w-full h-auto rounded-[30px]    shadow-md border\"\n                                style={{ maxHeight: '400px' }}\n                            />\n                        </div>\n                    </div>\n                </div>\n            )}\n\n            <div className=\"mt-6 text-sm text-gray-600\">\n                <h4 className=\"font-semibold mb-2\">ℹ️ How it works:</h4>\n                <ol className=\"list-decimal list-inside space-y-1\">\n                    <li>Uses the same HTML template system as EditProfile</li>\n                    <li>Generates HTML with creator info, supporter details, and amount</li>\n                    <li>Converts HTML to PNG using html2canvas</li>\n                    <li>Creates downloadable file for testing</li>\n                    <li>In production, this would be uploaded to Uploadcare and attached to posts</li>\n                </ol>\n            </div>\n        </div>\n    );\n}