
import React, { useState, useEffect } from 'react';
import { Plus, MoreHorizontal, Clock, MessageSquare, FileText, Lightbulb } from 'lucide-react';
import { Idea, IdeaStatus, UserRole, User, IdeaVariant } from '../types';
import { dbService } from '../services/db';
import IdeaModal from '../components/IdeaModal';

interface IdeaBankProps {
  currentUser: User;
  variant: IdeaVariant;
}

const IdeaBank: React.FC<IdeaBankProps> = ({ currentUser, variant }) => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [newIdeaTitle, setNewIdeaTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Drag & Drop State
  const [activeDragColumn, setActiveDragColumn] = useState<IdeaStatus | null>(null);
  const [draggedIdeaId, setDraggedIdeaId] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to real-time updates based on variant (TOPIC or POST)
    const unsubscribe = dbService.subscribeToIdeas(variant, (fetchedIdeas) => {
      // Client-side sorting by 'order'
      // Default to 0 if undefined, sort Ascending (smaller number first)
      const sorted = [...fetchedIdeas].sort((a, b) => (a.order || 0) - (b.order || 0));
      setIdeas(sorted);
    });

    // Cleanup subscription on unmount or variant change
    return () => unsubscribe();
  }, [variant]);

  const handleAddIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdeaTitle.trim()) return;
    
    try {
      await dbService.addIdea({
        title: newIdeaTitle,
        description: '',
        status: IdeaStatus.BACKLOG,
        tags: [],
        variant: variant // Save with the current variant
      });
      setNewIdeaTitle('');
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding idea:", error);
      alert("Błąd podczas dodawania. Sprawdź konsolę.");
    }
  };

  // --- DRAG AND DROP HANDLERS ---

  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggedIdeaId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
  };

  const onDragEnter = (e: React.DragEvent, status: IdeaStatus) => {
    e.preventDefault();
    setActiveDragColumn(status);
  };

  // Dropping on the Column (background) -> Move to end of that column
  const onDropColumn = async (e: React.DragEvent, status: IdeaStatus) => {
    e.preventDefault();
    e.stopPropagation(); // Stop bubbling
    setActiveDragColumn(null);
    
    const id = draggedIdeaId || e.dataTransfer.getData('text/plain');
    
    if (id) {
        try {
          // Find max order in this column to put at the end
          const colIdeas = ideas.filter(i => i.status === status);
          const maxOrder = colIdeas.length > 0 ? Math.max(...colIdeas.map(i => i.order || 0)) : 0;
          const newOrder = maxOrder + 1000; // Gap for future insertions

          await dbService.updateIdea(id, { 
            status: status,
            order: newOrder
          });
        } catch (error) {
          console.error("Error updating status:", error);
        }
    }
    setDraggedIdeaId(null);
  };

  // Dropping on a Card -> Insert BEFORE that card
  const onDropCard = async (e: React.DragEvent, targetIdea: Idea) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent dropping on column
    setActiveDragColumn(null);

    const id = draggedIdeaId || e.dataTransfer.getData('text/plain');

    if (id && id !== targetIdea.id) {
       try {
         const targetStatus = targetIdea.status;
         
         // Logic to calculate new order (Average between target and previous)
         const colIdeas = ideas.filter(i => i.status === targetStatus).sort((a,b) => (a.order || 0) - (b.order || 0));
         const targetIndex = colIdeas.findIndex(i => i.id === targetIdea.id);
         
         let newOrder = 0;
         if (targetIndex === 0) {
           // Insert at top
           newOrder = (targetIdea.order || 0) - 1000;
         } else {
           // Insert in middle
           const prevOrder = colIdeas[targetIndex - 1].order || 0;
           const nextOrder = targetIdea.order || 0;
           newOrder = (prevOrder + nextOrder) / 2;
         }

         await dbService.updateIdea(id, {
           status: targetStatus,
           order: newOrder
         });

       } catch (error) {
         console.error("Error reordering:", error);
       }
    }
    setDraggedIdeaId(null);
  };

  // -----------------------------

  const openIdea = (idea: Idea) => {
    setSelectedIdea(idea);
    setIsModalOpen(true);
  };

  const getColumns = () => {
    const isTopic = variant === IdeaVariant.TOPIC;
    return [
      { id: IdeaStatus.BACKLOG, title: isTopic ? 'Backlog (Tematy)' : 'Backlog (Posty)', color: 'border-gray-200', bg: 'bg-gray-100' },
      { id: IdeaStatus.TODO, title: 'Do Realizacji', color: 'border-indigo-200', bg: 'bg-indigo-50' },
      { id: IdeaStatus.CHANGES_REQUIRED, title: 'Do zmiany', color: 'border-orange-200', bg: 'bg-orange-50' },
      { id: IdeaStatus.REJECTED, title: 'Odrzucone', color: 'border-red-200', bg: 'bg-red-50' },
    ];
  };

  const terminology = variant === IdeaVariant.TOPIC ? 'temat' : 'post';
  const Terminology = variant === IdeaVariant.TOPIC ? 'Temat' : 'Post';

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600 max-w-2xl">
          Przeciągaj {terminology}y między kolumnami. Upuść na inną kartę, aby zmienić kolejność.
        </p>
        {currentUser.role === UserRole.ADMIN && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            <Plus size={18} /> Nowy {Terminology}
          </button>
        )}
      </div>

      {isAdding && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow border border-gray-200 animate-in fade-in slide-in-from-top-4">
          <form onSubmit={handleAddIdea} className="flex gap-4">
            <input
              type="text"
              value={newIdeaTitle}
              onChange={(e) => setNewIdeaTitle(e.target.value)}
              placeholder={`Wpisz tytuł dla ${terminology}u...`}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
              autoFocus
            />
            <button type="submit" className="px-6 py-2 bg-black text-white rounded-lg font-medium">Dodaj</button>
            <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg">Anuluj</button>
          </form>
        </div>
      )}

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {getColumns().map((col) => {
          const isActive = activeDragColumn === col.id;
          return (
            <div 
              key={col.id}
              className={`flex-1 min-w-[300px] flex flex-col rounded-xl border-2 transition-all duration-200
                ${col.color} ${col.bg}
                ${isActive ? 'ring-2 ring-black ring-offset-2 scale-[1.01] shadow-lg bg-opacity-80' : ''}
              `}
              onDragOver={onDragOver}
              onDragEnter={(e) => onDragEnter(e, col.id)}
              onDrop={(e) => onDropColumn(e, col.id)}
            >
              <div className="p-4 font-semibold text-gray-700 flex justify-between items-center pointer-events-none">
                {col.title}
                <span className="bg-white/50 px-2 py-1 rounded text-xs">
                  {ideas.filter(i => i.status === col.id).length}
                </span>
              </div>
              
              <div className="flex-1 p-3 space-y-3 overflow-y-auto min-h-[100px]">
                {ideas.filter(i => i.status === col.id).map((idea) => (
                  <div
                    key={idea.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, idea.id)}
                    onDragOver={onDragOver}
                    onDrop={(e) => onDropCard(e, idea)}
                    onClick={() => openIdea(idea)}
                    className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-all group relative hover:-translate-y-0.5
                        ${draggedIdeaId === idea.id ? 'opacity-40 ring-2 ring-indigo-400' : 'opacity-100'}
                    `}
                  >
                    <div className="flex justify-between items-start mb-2 pointer-events-none">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        {variant === IdeaVariant.TOPIC ? <Lightbulb size={12}/> : <FileText size={12}/>}
                        {new Date(idea.createdAt).toLocaleDateString()}
                      </span>
                      <button className="text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                    <h3 className="font-medium text-gray-800 mb-2 pointer-events-none">{idea.title}</h3>
                    <div className="flex flex-wrap gap-2 mb-3 pointer-events-none">
                      {idea.tags.map(tag => (
                        <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-full">{tag}</span>
                      ))}
                    </div>
                    {idea.comments && idea.comments.length > 0 && (
                      <div className="flex items-center gap-1 text-gray-400 text-xs border-t border-gray-100 pt-2 pointer-events-none">
                          <MessageSquare size={12} /> {idea.comments.length}
                      </div>
                    )}
                  </div>
                ))}
                
                {ideas.filter(i => i.status === col.id).length === 0 && (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-300/50 rounded-lg pointer-events-none min-h-[100px]">
                    Upuść tutaj
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <IdeaModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        idea={selectedIdea ? ideas.find(i => i.id === selectedIdea.id) || null : null}
        currentUser={currentUser}
        refreshData={() => {}} 
      />
    </div>
  );
};

export default IdeaBank;
