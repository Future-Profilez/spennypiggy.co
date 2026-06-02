import React from 'react';
import ContentFilePreview from './ContentFilePreview';

/**
 * Test component to showcase ContentFilePreview with different file types
 */
export default function ContentFilePreviewTest() {
    const testFiles = [
        {
            fileUrl: 'https://ucarecdn.com/example-image.jpg/',
            fileName: 'Profile Photo.jpg',
            fileType: 'image/jpeg',
            fileSize: 2048000, // 2MB
            isImage: true,
            isVideo: false,
            isAudio: false
        },
        {
            fileUrl: 'https://ucarecdn.com/example-video.mp4/',
            fileName: 'Demo Video.mp4',
            fileType: 'video/mp4',
            fileSize: 15728640, // 15MB
            isImage: false,
            isVideo: true,
            isAudio: false
        },
        {
            fileUrl: 'https://ucarecdn.com/example-audio.mp3/',
            fileName: 'Background Music.mp3',
            fileType: 'audio/mpeg',
            fileSize: 5242880, // 5MB
            isImage: false,
            isVideo: false,
            isAudio: true
        },
        {
            fileUrl: 'https://ucarecdn.com/example-document.pdf/',
            fileName: 'User Manual.pdf',
            fileType: 'application/pdf',
            fileSize: 1048576, // 1MB
            isImage: false,
            isVideo: false,
            isAudio: false
        },
        {
            fileUrl: 'https://ucarecdn.com/example-doc.docx/',
            fileName: 'Project Proposal.docx',
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            fileSize: 524288, // 512KB
            isImage: false,
            isVideo: false,
            isAudio: false
        },
        {
            fileUrl: 'https://ucarecdn.com/example-archive.zip/',
            fileName: 'Project Files.zip',
            fileType: 'application/zip',
            fileSize: 10485760, // 10MB
            isImage: false,
            isVideo: false,
            isAudio: false
        }
    ];

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Content File Preview Test</h1>
            <p className="text-gray-600 mb-8">
                This demonstrates how the ContentFilePreview component handles different file types:
            </p>
            
            <div className="space-y-6">
                {testFiles.map((file, index) => (
                    <div key={index}>
                        <h3 className="text-lg font-semibold mb-3">
                            {file.isImage ? 'Image File' : 
                             file.isVideo ? 'Video File' : 
                             file.isAudio ? 'Audio File' : 
                             file.fileType.includes('pdf') ? 'PDF Document' : 
                             file.fileType.includes('word') ? 'Word Document' : 
                             file.fileType.includes('zip') ? 'Archive File' : 'Other File'}
                        </h3>
                        <ContentFilePreview 
                            fileUrl={file.fileUrl}
                            fileType={file.fileType}
                            fileName={file.fileName}
                            fileSize={file.fileSize}
                            isImage={file.isImage}
                            isVideo={file.isVideo}
                            isAudio={file.isAudio}
                            className="mb-4"
                        />
                    </div>
                ))}
            </div>

            <div className="mt-12 p-6 bg-gray-50 rounded-[30px]   ">
                <h2 className="text-xl font-bold mb-4">Features Demonstrated:</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li><strong>Image Files:</strong> Shows thumbnail preview with error fallback</li>
                    <li><strong>Video Files:</strong> Shows video thumbnail with play overlay + full video player</li>
                    <li><strong>Audio Files:</strong> Shows audio icon + integrated audio player</li>
                    <li><strong>PDF Documents:</strong> Shows PDF icon with appropriate styling</li>
                    <li><strong>Word Documents:</strong> Shows Word icon with document type detection</li>
                    <li><strong>Archive Files:</strong> Shows archive icon for ZIP/RAR files</li>
                    <li><strong>File Size:</strong> Displays formatted file sizes (KB, MB, GB)</li>
                    <li><strong>Smart Actions:</strong> Context-appropriate view/download buttons</li>
                </ul>
            </div>
        </div>
    );
}