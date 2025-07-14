import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, MessageSquare, GitBranch } from 'lucide-react';
import { botFlowService, BotFlow, BotCondition, BotResponse } from '../services/botFlowService';
import ConditionModal from './ConditionModal';
import ResponseModal from './ResponseModal';

interface BotFlowEditorProps {
  flow: BotFlow;
  onClose: () => void;
  onSave: () => void;
}

interface ConditionNode {
  condition: BotCondition;
  children: ConditionNode[];
  isExpanded: boolean;
}

const BotFlowEditor: React.FC<BotFlowEditorProps> = ({ flow, onClose }) => {
  const [conditions, setConditions] = useState<BotCondition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [editingCondition, setEditingCondition] = useState<BotCondition | null>(null);
  const [editingResponse, setEditingResponse] = useState<BotResponse | null>(null);
  const [parentConditionId, setParentConditionId] = useState<string | null>(null);

  useEffect(() => {
    loadFlowDetails();
  }, [flow.id]);

  const loadFlowDetails = async () => {
    try {
      setLoading(true);
      const response = await botFlowService.getFlow(flow.id);
      setConditions(response.data.conditions || []);
    } catch (error) {
      console.error('Error cargando detalles del flujo:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildConditionTree = (): ConditionNode[] => {
    const conditionMap = new Map<string, ConditionNode>();
    const rootNodes: ConditionNode[] = [];

    // Crear nodos para todas las condiciones
    conditions.forEach(condition => {
      conditionMap.set(condition.id, {
        condition,
        children: [],
        isExpanded: true
      });
    });

    // Construir el árbol
    conditions.forEach(condition => {
      const node = conditionMap.get(condition.id)!;
      if (condition.parentConditionId) {
        const parent = conditionMap.get(condition.parentConditionId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  };

  const handleAddCondition = (parentId?: string) => {
    setParentConditionId(parentId || null);
    setEditingCondition(null);
    setShowConditionModal(true);
  };

  const handleEditCondition = (condition: BotCondition) => {
    setEditingCondition(condition);
    setParentConditionId(null);
    setShowConditionModal(true);
  };

  const handleDeleteCondition = async (conditionId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta condición?')) {
      try {
        await botFlowService.deleteCondition(conditionId);
        await loadFlowDetails();
      } catch (error) {
        console.error('Error eliminando condición:', error);
      }
    }
  };

  const handleAddResponse = () => {
    setEditingResponse(null);
    setShowResponseModal(true);
  };

  const handleEditResponse = (response: BotResponse) => {
    setEditingResponse(response);
    setShowResponseModal(true);
  };

  const handleDeleteResponse = async (responseId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta respuesta?')) {
      try {
        await botFlowService.deleteResponse(responseId);
        await loadFlowDetails();
      } catch (error) {
        console.error('Error eliminando respuesta:', error);
      }
    }
  };

  const renderConditionNode = (node: ConditionNode, level: number = 0): React.ReactNode => {
    const { condition, children, isExpanded } = node;
    const [expanded, setExpanded] = useState(isExpanded);

    return (
      <div key={condition.id} className="ml-4">
        <div className={`flex items-center p-3 bg-white border rounded-lg mb-2 ${level > 0 ? 'border-l-4 border-l-blue-500' : ''}`}>
          <button
            onClick={() => setExpanded(!expanded)}
            className="mr-2 text-gray-500 hover:text-gray-700"
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <GitBranch size={16} className="text-blue-500" />
              <span className="font-medium text-gray-900">
                {condition.field} {condition.operator} "{condition.value}"
              </span>
            </div>
            
                         {condition.responses && condition.responses.length > 0 && (
               <div className="mt-2">
                 <div className="text-sm text-gray-600 mb-1">Respuestas:</div>
                 {condition.responses.map((response) => (
                  <div key={response.id} className="flex items-center gap-2 ml-4 mb-1">
                    <MessageSquare size={14} className="text-green-500" />
                    <span className="text-sm text-gray-700">{response.message}</span>
                    <button
                      onClick={() => handleEditResponse(response)}
                      className="text-blue-600 hover:text-blue-800 text-xs"
                    >
                      <Edit size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteResponse(response.id)}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-1">
                         <button
               onClick={() => handleAddResponse()}
               className="p-1 text-green-600 hover:text-green-800"
               title="Agregar respuesta"
             >
               <MessageSquare size={16} />
             </button>
            <button
              onClick={() => handleAddCondition(condition.id)}
              className="p-1 text-blue-600 hover:text-blue-800"
              title="Agregar condición hija"
            >
              <GitBranch size={16} />
            </button>
            <button
              onClick={() => handleEditCondition(condition)}
              className="p-1 text-blue-600 hover:text-blue-800"
              title="Editar condición"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => handleDeleteCondition(condition.id)}
              className="p-1 text-red-600 hover:text-red-800"
              title="Eliminar condición"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {expanded && children.length > 0 && (
          <div className="ml-4">
            {children.map(child => renderConditionNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const conditionTree = buildConditionTree();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Editor de Flujo: {flow.name}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => handleAddCondition()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus size={16} />
              Agregar Condición Raíz
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {conditionTree.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">No hay condiciones configuradas</div>
              <button
                onClick={() => handleAddCondition()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto transition-colors"
              >
                <Plus size={16} />
                Crear primera condición
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {conditionTree.map(node => renderConditionNode(node))}
            </div>
          )}
        </div>

        {showConditionModal && (
          <ConditionModal
            condition={editingCondition}
            parentConditionId={parentConditionId}
            botFlowId={flow.id}
            onClose={() => {
              setShowConditionModal(false);
              setEditingCondition(null);
              setParentConditionId(null);
            }}
            onSave={async () => {
              await loadFlowDetails();
              setShowConditionModal(false);
              setEditingCondition(null);
              setParentConditionId(null);
            }}
          />
        )}

        {showResponseModal && (
          <ResponseModal
            response={editingResponse}
            conditionId={editingResponse?.botConditionId || ''}
            onClose={() => {
              setShowResponseModal(false);
              setEditingResponse(null);
            }}
            onSave={async () => {
              await loadFlowDetails();
              setShowResponseModal(false);
              setEditingResponse(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default BotFlowEditor; 