import React, { useState, useEffect } from 'react';
import { BotFlow, BotFlowStep } from '../types/api';

interface BotFlowEditorProps {
  botFlow: BotFlow | null;
  onSave: (botFlow: BotFlow) => void;
  onCancel: () => void;
  flow?: BotFlow | null;
}

const BotFlowEditor: React.FC<BotFlowEditorProps> = ({ botFlow, onSave, onCancel }) => {
  const [currentFlow, setCurrentFlow] = useState<BotFlow | null>(botFlow);
  const [selectedStep, setSelectedStep] = useState<BotFlowStep | null>(null);

  useEffect(() => {
    setCurrentFlow(botFlow);
  }, [botFlow]);

  const handleSave = () => {
    if (currentFlow) {
      onSave(currentFlow);
    }
  };

  if (!currentFlow) {
    return <div className="p-4">Cargando editor de flujo...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Editor de Flujo de Bot</h2>
        <div className="space-x-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Guardar
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancelar
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium mb-4">Flujo: {currentFlow.name}</h3>
            <p className="text-gray-600 mb-4">{currentFlow.description}</p>
            
            <div className="space-y-4">
              {currentFlow.steps?.map((step, index) => (
                <div
                  key={step.id}
                  className={`p-3 border rounded cursor-pointer ${
                    selectedStep?.id === step.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedStep(step)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Paso {index + 1}: {step.name}</span>
                    <span className="text-sm text-gray-500">{step.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium mb-4">Propiedades del Paso</h3>
            {selectedStep ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    type="text"
                    value={selectedStep.name}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo</label>
                  <input
                    type="text"
                    value={selectedStep.type}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Configuración</label>
                  <textarea
                    value={JSON.stringify(selectedStep.config, null, 2)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={6}
                    readOnly
                  />
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Selecciona un paso para ver sus propiedades</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BotFlowEditor; 