import React, { useState, useEffect } from 'react';
import { Plus, MoreHorizontal, Clock, MessageSquare } from 'lucide-react';
import { Idea, IdeaStatus, UserRole, User } from '../types';
import { dbService } from '../services/db';
import IdeaModal from '../components/IdeaModal';

interface IdeaBankProps {
  currentUser: User;
}

const IdeaBank: React.FC<IdeaBankProps> = ({ currentUser }) => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [newIdeaTitle, setNewIdeaTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = dbService.subscribeToIdeas((fetchedIdeas) => {
      setIdeas(fetchedIdeas);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleAddIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdeaTitle.trim()) return;
    
    await dbService.addIdea({
      title: newIdeaTitle,
      description: '',
      status: IdeaStatus.BACKLOG,
      tags: []
    });
    setNewIdeaTitle('');
    setIsAdding(false);
  };

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('ideaId', id);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = async (e: React.DragEvent, status: IdeaStatus) => {
    const id = e.dataTransfer.getData('ideaId');
    await dbService.updateIdeaStatus(id, status);
  };

  const openIdea = (idea: Idea) => {
    setSelectedIdea(idea);
    setIsModalOpen(true);
  };

  const getColumns = () => [
    { id: IdeaStatus.BACKLOG, title: 'Backlog (Pomysły)', color: 'bg-gray-100 border-gray-200' },
    { id: IdeaStatus.TODO, title: 'Do Realizacji (Wybrane)', color: 'bg-indigo-50 border-indigo-200' },
    { id: IdeaStatus.CHANGES_REQUIRED, title: 'Do zmiany', color: 'bg-orange-50 border-orange-200' },
    { id: IdeaStatus.REJECTED, title: 'Odrzucone', color: 'bg-red-50 border-red-200' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600 max-w-2xl">
          Przeciągaj pomysły między kolumnami. Jako <strong>{currentUser.role === UserRole.ADMIN ? 'Kreator' : 'Klient'}</strong> masz pełną kontrolę. Kliknij kartę, aby zobaczyć szczegóły.
        </p>
        {currentUser.role === UserRole.ADMIN && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            <Plus size={18} /> Nowy Pomysł
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
              placeholder="Wpisz krótki tytuł pomysłu..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
              autoFocus
            />
            <button type="submit" className="px-6 py-2 bg-black text-white rounded-lg font-medium">Dodaj</button>
            <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg">Anuluj</button>
          </form>
        </div>
      )}

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {getColumns().map((col) => (
          <div 
            key={col.id}
            className={`flex-1 min-w-[300px] flex flex-col rounded-xl border-2 ${col.color} transition-colors`}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, col.id)}
          >
            <div className="p-4 font-semibold text-gray-700 flex justify-between items-center">
              {col.title}
              <span className="bg-white/50 px-2 py-1 rounded text-xs">
                {ideas.filter(i => i.status === col.id).length}
              </span>
            </div>
            
            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {ideas.filter(i => i.status === col.id).map((idea) => (
                <div
                  key={idea.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, idea.id)}
                  onClick={() => openIdea(idea)}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-all group relative hover:-translate-y-0.5"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={10} /> {new Date(idea.createdAt).toLocaleDateString()}
                    </span>
                    <button className="text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                  <h3 className="font-medium text-gray-800 mb-2">{idea.title}</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {idea.tags.map(tag => (
                      <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-full">{tag}</span>
                    ))}
                  </div>
                  {idea.comments && idea.comments.length > 0 && (
                    <div className="flex items-center gap-1 text-gray-400 text-xs border-t border-gray-100 pt-2">
                        <MessageSquare size={12} /> {idea.comments.length}
                    </div>
                  )}
                </div>
              ))}
              {ideas.filter(i => i.status === col.id).length === 0 && (
                <div className="h-32 flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-300/50 rounded-lg">
                  Upuść tutaj
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <IdeaModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        idea={selectedIdea ? ideas.find(i => i.id === selectedIdea.id) || null : null}
        currentUser={currentUser}
        refreshData={() => {}} // Not needed with realtime listener
      />
    </div>
  );
};

export default IdeaBank;