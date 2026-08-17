import React from 'react';
import { 
    FaFilePdf, 
    FaFileWord, 
    FaFileExcel, 
    FaFilePowerpoint, 
    FaFileAudio, 
    FaFileVideo, 
    FaFileImage, 
    FaFileArchive, 
    FaFile 
} from 'react-icons/fa';

/**
 * ContentFilePreview component to display file previews based on file type
 */
export default function ContentFilePreview({ 
    fileUrl, 
    fileType, 
    fileName, 
    fileSize, 
    isImage, 
    isVideo, 
    isAudio, 
    className = "" 
}) {
    if (!fileUrl) return null;

    const getFileIcon = (type) => {
        if (!type) return <FaFile className="text-gray-500" size="1.5rem" />;
        
        // Normalize type to lowercase
        const lowerType = type.toLowerCase();
        
        if (lowerType.includes('pdf')) {
            return <FaFilePdf className="text-red-500" size="1.5rem" />;
        }
        if (lowerType.includes('word') || lowerType.includes('msword') || lowerType.includes('wordprocessingml')) {
            return <FaFileWord className="text-blue-500" size="1.5rem" />;
        }
        if (lowerType.includes('excel') || lowerType.includes('sheet') || lowerType.includes('ms-excel')) {
            return <FaFileExcel className="text-green-500" size="1.5rem" />;
        }
        if (lowerType.includes('powerpoint') || lowerType.includes('presentation') || lowerType.includes('ms-powerpoint')) {
            return <FaFilePowerpoint className="text-orange-500" size="1.5rem" />;
        }
        if (lowerType.includes('audio') || lowerType.includes('mp3') || lowerType.includes('wav') || lowerType.includes('ogg') || lowerType.includes('aac') || lowerType.includes('flac')) {
            return <FaFileAudio className="text-purple-500" size="1.5rem" />;
        }
        if (lowerType.includes('video') || lowerType.includes('mp4') || lowerType.includes('avi') || lowerType.includes('mov') || lowerType.includes('webm')) {
            return <FaFileVideo className="text-blue-600" size="1.5rem" />;
        }
        if (lowerType.includes('image') || lowerType.includes('jpeg') || lowerType.includes('png') || lowerType.includes('gif') || lowerType.includes('webp')) {
            return <FaFileImage className="text-green-600" size="1.5rem" />;
        }
        if (lowerType.includes('zip') || lowerType.includes('archive') || lowerType.includes('rar') || lowerType.includes('7z') || lowerType.includes('tar')) {
            return <FaFileArchive className="text-yellow-600" size="1.5rem" />;
        }
        if (lowerType.includes('text') || lowerType.includes('plain')) {
            return <FaFile className="text-gray-600" size="1.5rem" />;
        }
        
        return <FaFile className="text-gray-500" size="1.5rem" />;
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    };

    const getFileTypeLabel = (type) => {
        if (!type) return 'File';
        
        const lowerType = type.toLowerCase();
        
        if (lowerType.includes('pdf')) return 'PDF Document';
        if (lowerType.includes('word') || lowerType.includes('msword') || lowerType.includes('wordprocessingml')) return 'Word Document';
        if (lowerType.includes('excel') || lowerType.includes('sheet') || lowerType.includes('ms-excel')) return 'Excel Spreadsheet';
        if (lowerType.includes('powerpoint') || lowerType.includes('presentation') || lowerType.includes('ms-powerpoint')) return 'PowerPoint Presentation';
        if (lowerType.includes('audio') || lowerType.includes('mp3') || lowerType.includes('wav') || lowerType.includes('ogg')) return 'Audio File';
        if (lowerType.includes('video') || lowerType.includes('mp4') || lowerType.includes('avi') || lowerType.includes('mov')) return 'Video File';
        if (lowerType.includes('image') || lowerType.includes('jpeg') || lowerType.includes('png') || lowerType.includes('gif')) return 'Image File';
        if (lowerType.includes('zip') || lowerType.includes('archive') || lowerType.includes('rar')) return 'Archive File';
        if (lowerType.includes('text') || lowerType.includes('plain')) return 'Text Document';
        
        return 'File';
    };

    // Use props to determine file type, with fallback to MIME type detection
    const isImageFile = isImage || (fileType && fileType.toLowerCase().includes('image'));
    const isVideoFile = isVideo || (fileType && fileType.toLowerCase().includes('video'));
    const isAudioFile = isAudio || (fileType && fileType.toLowerCase().includes('audio'));

    return (
        <div className={`content-file-preview bg-white border border-gray-200 rounded-box-sm lg:rounded-box p-3 ${className}`}>
            <div className="md:flex items-start space-y-3 md:space-y-0 md:space-x-4">
                {/* File preview based on type */}
                <div className="flex-shrink-0">
                    {isImageFile ? (
                        <div className="relative">
                            <img 
                                src={fileUrl} 
                                alt={fileName || "Content preview"}
                                className="w-20 h-20 object-cover rounded-box-sm lg:rounded-box border "
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                            <div className="w-20 h-20 bg-gray-100 border rounded-box   lg:rounded-box   flex items-center justify-center" style={{display: 'none'}}>
                                <FaFileImage className="text-gray-500" size="1.5rem" />
                            </div>
                        </div>
                    ) : isVideoFile ? (
                        <div className="relative">
                            <video 
                                src={fileUrl}
                                className="w-20 h-20 object-cover rounded-box lg:rounded-box border "
                                controls={false}
                                muted
                                preload="none"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                            <div className="w-20 h-20 bg-blue-50 border rounded-box   lg:rounded-box   flex items-center justify-center" style={{display: 'none'}}>
                                <FaFileVideo className="text-blue-600" size="1.5rem" />
                            </div>
                            {/* Play icon overlay */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                    <div className="w-0 h-0 border-l-4 border-l-white border-t-2 border-t-transparent border-b-2 border-b-transparent ml-1"></div>
                                </div>
                            </div>
                        </div>
                    ) : isAudioFile ? (
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 border rounded-box   lg:rounded-box   flex flex-col items-center justify-center">
                            <FaFileAudio className="text-purple-600" size="1.5rem" />
                            <div className="text-xs text-purple-700 mt-1">♪</div>
                        </div>
                    ) : (
                        <div className="w-20 h-20 bg-gray-50 border rounded-box   lg:rounded-box   flex items-center justify-center">
                            {getFileIcon(fileType)}
                        </div>
                    )}
                </div>
                
                {/* File info */}
                <div className="flex-1 min-w-0">
                    <div className="mb-2">
                        <h4 title={fileName || 'Content File'} className="text-sm font-semibold text-gray-900 truncate">
                            {fileName || 'Content File'}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {getFileTypeLabel(fileType)}
                            </span>
                            {fileSize && (
                                <span className="text-xs text-gray-500">
                                    {formatFileSize(fileSize)}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    {/* Media-specific controls */}
                    {isVideoFile && (
                        <div className="mb-2">
                            <video 
                                src={fileUrl}
                                controls
                                className="w-full max-w-xs max-h-[200px] h-auto rounded border"
                                preload="none"
                            >
                                Your browser does not support video playback.
                            </video>
                        </div>
                    )}
                    
                    {isAudioFile && (
                        <div className="mb-2">
                            <audio 
                                src={fileUrl}
                                controls
                                className="w-full max-w-xs"
                                preload="metadata"
                            >
                                Your browser does not support audio playback.
                            </audio>
                        </div>
                    )}
                    
                    <p className="text-xs text-gray-500">
                        ✓ Ready for delivery to buyers
                    </p>
                </div>
                
                {/* Preview/Download actions */}
                <div className="flex-shrink-0 flex flex-col space-y-2">
                    {/* <a 
                        href={fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex text-center items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-box   lg:rounded-box   text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
                    >
                        {isImageFile || isVideoFile ? 'View' : 'Download'}
                    </a> */}
                    {(isImageFile && !isVideoFile && !isAudioFile) && (
                        <a  target="_blank"
                            rel="noopener noreferrer"
                            href={`${fileUrl}/-/format/auto/-/quality/best/`}
                            download
                            className="!text-center  items-center px-3 py-1.5 border border-pink-300 text-sm font-medium rounded-box   lg:rounded-box   text-pink-700 bg-pink-50 hover:bg-pink-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
                        >
                            View
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}