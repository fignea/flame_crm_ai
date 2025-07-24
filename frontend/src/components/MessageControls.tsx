import React, { useState, useRef } from 'react';
import { MapPin, Paperclip, Image, Video, Volume2, File, X, Send } from 'lucide-react';

interface MessageControlsProps {
  onSendMessage: (content: string, mediaType?: string, mediaUrl?: string) => void;
  onSendLocation: (latitude: number, longitude: number, address?: string) => void;
  onSendFile: (file: File, fileType: string) => void;
  disabled?: boolean;
}

export const MessageControls: React.FC<MessageControlsProps> = ({
  onSendMessage,
  onSendLocation,
  onSendFile,
  disabled = false
}) => {
  const [message, setMessage] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      let fileType = 'document';
      if (file.type.startsWith('image/')) fileType = 'image';
      else if (file.type.startsWith('video/')) fileType = 'video';
      else if (file.type.startsWith('audio/')) fileType = 'audio';
      
      onSendFile(file, fileType);
      setShowAttachMenu(false);
    }
  };

  const sendCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('La geolocalización no está disponible en este navegador');
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onSendLocation(latitude, longitude);
        setShowLocationModal(false);
        setLocationLoading(false);
      },
      (error) => {
        console.error('Error obteniendo ubicación:', error);
        alert('Error obteniendo la ubicación. Verifica los permisos.');
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const sendCustomLocation = (address: string) => {
    // Aquí podrías implementar geocoding para convertir dirección a coordenadas
    // Por ahora, solo enviamos la dirección
    onSendLocation(0, 0, address);
    setShowLocationModal(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center space-x-2 p-4 bg-white border-t">
        {/* Botón de adjuntar */}
        <div className="relative">
          <button
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            disabled={disabled}
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          {/* Menú de adjuntos */}
          {showAttachMenu && (
            <div className="absolute bottom-full mb-2 left-0 bg-white border rounded-lg shadow-lg p-2 min-w-[200px]">
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowAttachMenu(false);
                }}
                className="w-full flex items-center space-x-2 p-2 hover:bg-gray-100 rounded text-left"
              >
                <Image className="w-4 h-4 text-blue-500" />
                <span>Imagen</span>
              </button>
              
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowAttachMenu(false);
                }}
                className="w-full flex items-center space-x-2 p-2 hover:bg-gray-100 rounded text-left"
              >
                <Video className="w-4 h-4 text-green-500" />
                <span>Video</span>
              </button>
              
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowAttachMenu(false);
                }}
                className="w-full flex items-center space-x-2 p-2 hover:bg-gray-100 rounded text-left"
              >
                <Volume2 className="w-4 h-4 text-purple-500" />
                <span>Audio</span>
              </button>
              
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowAttachMenu(false);
                }}
                className="w-full flex items-center space-x-2 p-2 hover:bg-gray-100 rounded text-left"
              >
                <File className="w-4 h-4 text-gray-500" />
                <span>Documento</span>
              </button>
              
              <hr className="my-2" />
              
              <button
                onClick={() => {
                  setShowLocationModal(true);
                  setShowAttachMenu(false);
                }}
                className="w-full flex items-center space-x-2 p-2 hover:bg-gray-100 rounded text-left"
              >
                <MapPin className="w-4 h-4 text-red-500" />
                <span>Ubicación</span>
              </button>
            </div>
          )}
        </div>

        {/* Campo de texto */}
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe un mensaje..."
            className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            disabled={disabled}
          />
        </div>

        {/* Botón de enviar */}
        <button
          onClick={handleSendMessage}
          disabled={!message.trim() || disabled}
          className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Input oculto para archivos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Modal de ubicación */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Enviar Ubicación</h3>
              <button
                onClick={() => setShowLocationModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={sendCurrentLocation}
                disabled={locationLoading}
                className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {locationLoading ? 'Obteniendo ubicación...' : 'Enviar mi ubicación actual'}
              </button>
              
              <div className="text-center text-gray-500">o</div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección personalizada:
                </label>
                <input
                  type="text"
                  placeholder="Ingresa una dirección"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const address = (e.target as HTMLInputElement).value.trim();
                      if (address) {
                        sendCustomLocation(address);
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 