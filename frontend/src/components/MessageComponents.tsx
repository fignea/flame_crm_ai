import React from 'react';
import { MapPin, Download, File, Image, Video, Volume2, Clock, Check, CheckCheck, AlertCircle } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  fromMe: boolean;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  mediaType?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location';
  mediaUrl?: string;
  timestamp: string;
  locationLatitude?: number;
  locationLongitude?: number;
  locationAddress?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
}

interface MessageComponentsProps {
  message: Message;
  formatTime: (timestamp: string) => string;
  formatFileSize: (size: number) => string;
}

// Componente para mostrar el estado del mensaje
export const MessageStatus: React.FC<{ status: string }> = ({ status }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'sent':
        return <Check className="w-4 h-4 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <span className="flex items-center">
      {getStatusIcon()}
    </span>
  );
};

// Componente para mensajes de ubicación
export const LocationMessage: React.FC<MessageComponentsProps> = ({ message, formatTime }) => {
  const { locationLatitude, locationLongitude, locationAddress } = message;

  const openInMaps = () => {
    if (locationLatitude && locationLongitude) {
      const url = `https://maps.google.com/maps?q=${locationLatitude},${locationLongitude}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-xs">
      <div className="flex items-center space-x-2 mb-2">
        <MapPin className="w-5 h-5 text-red-500" />
        <span className="font-medium text-gray-700">Ubicación</span>
      </div>
      
      {locationAddress && (
        <p className="text-sm text-gray-600 mb-2">{locationAddress}</p>
      )}
      
      <div className="text-xs text-gray-500 mb-3">
        {locationLatitude?.toFixed(6)}, {locationLongitude?.toFixed(6)}
      </div>
      
      <button
        onClick={openInMaps}
        className="w-full bg-blue-500 text-white py-2 px-3 rounded text-sm hover:bg-blue-600 transition-colors"
      >
        Ver en Maps
      </button>
      
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
        {message.fromMe && <MessageStatus status={message.status} />}
      </div>
    </div>
  );
};

// Componente para mensajes de archivo
export const FileMessage: React.FC<MessageComponentsProps> = ({ message, formatTime, formatFileSize }) => {
  const { fileName, fileSize, fileMimeType, mediaUrl } = message;

  const getFileIcon = () => {
    if (fileMimeType?.startsWith('image/')) {
      return <Image className="w-8 h-8 text-blue-500" />;
    } else if (fileMimeType?.startsWith('video/')) {
      return <Video className="w-8 h-8 text-green-500" />;
    } else if (fileMimeType?.startsWith('audio/')) {
      return <Volume2 className="w-8 h-8 text-purple-500" />;
    } else {
      return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  const downloadFile = () => {
    if (mediaUrl) {
      const link = document.createElement('a');
      link.href = mediaUrl;
      link.download = fileName || 'archivo';
      link.click();
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-xs">
      <div className="flex items-center space-x-3">
        {getFileIcon()}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700 truncate">
            {fileName || 'Archivo'}
          </p>
          <p className="text-xs text-gray-500">
            {fileSize ? formatFileSize(fileSize) : 'Tamaño desconocido'}
          </p>
        </div>
        <button
          onClick={downloadFile}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          title="Descargar archivo"
        >
          <Download className="w-4 h-4 text-gray-600" />
        </button>
      </div>
      
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
        {message.fromMe && <MessageStatus status={message.status} />}
      </div>
    </div>
  );
};

// Componente para mensajes de imagen con preview
export const ImageMessage: React.FC<MessageComponentsProps> = ({ message, formatTime }) => {
  const { mediaUrl, fileName } = message;

  return (
    <div className="max-w-xs">
      {mediaUrl && (
        <div className="mb-2">
          <img 
            src={mediaUrl} 
            alt={fileName || 'Imagen'}
            className="w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(mediaUrl, '_blank')}
          />
        </div>
      )}
      
      {message.content && (
        <p className="text-sm text-gray-700 mb-2">{message.content}</p>
      )}
      
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
        {message.fromMe && <MessageStatus status={message.status} />}
      </div>
    </div>
  );
};

// Componente para mensajes de video
export const VideoMessage: React.FC<MessageComponentsProps> = ({ message, formatTime }) => {
  const { mediaUrl } = message;

  return (
    <div className="max-w-xs">
      {mediaUrl && (
        <div className="mb-2">
          <video 
            src={mediaUrl}
            controls
            className="w-full h-auto rounded-lg"
            preload="metadata"
          >
            Tu navegador no soporta el elemento video.
          </video>
        </div>
      )}
      
      {message.content && (
        <p className="text-sm text-gray-700 mb-2">{message.content}</p>
      )}
      
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
        {message.fromMe && <MessageStatus status={message.status} />}
      </div>
    </div>
  );
};

// Componente para mensajes de audio
export const AudioMessage: React.FC<MessageComponentsProps> = ({ message, formatTime }) => {
  const { mediaUrl, fileName } = message;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-xs">
      <div className="flex items-center space-x-3 mb-3">
        <Volume2 className="w-6 h-6 text-purple-500" />
        <span className="text-sm font-medium text-gray-700">
          {fileName || 'Audio'}
        </span>
      </div>
      
      {mediaUrl && (
        <audio controls className="w-full mb-3">
          <source src={mediaUrl} />
          Tu navegador no soporta el elemento audio.
        </audio>
      )}
      
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
        {message.fromMe && <MessageStatus status={message.status} />}
      </div>
    </div>
  );
};

// Componente principal que decide qué componente usar
export const MessageRenderer: React.FC<MessageComponentsProps> = ({ message, formatTime, formatFileSize }) => {
  switch (message.mediaType) {
    case 'location':
      return <LocationMessage message={message} formatTime={formatTime} formatFileSize={formatFileSize} />;
    case 'image':
      return <ImageMessage message={message} formatTime={formatTime} formatFileSize={formatFileSize} />;
    case 'video':
      return <VideoMessage message={message} formatTime={formatTime} formatFileSize={formatFileSize} />;
    case 'audio':
      return <AudioMessage message={message} formatTime={formatTime} formatFileSize={formatFileSize} />;
    case 'document':
      return <FileMessage message={message} formatTime={formatTime} formatFileSize={formatFileSize} />;
    default:
      // Mensaje de texto normal
      return (
        <div>
          <p className="text-sm text-gray-700 mb-1">{message.content}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
            {message.fromMe && <MessageStatus status={message.status} />}
          </div>
        </div>
      );
  }
}; 