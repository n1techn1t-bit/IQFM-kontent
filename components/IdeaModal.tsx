
import React, { useState, useEffect } from 'react';
import { X, Send, Lightbulb, AlertTriangle, Trash2 } from 'lucide-react';
import { Idea, IdeaStatus, User, UserRole, Comment } from '../types';
import { dbService } from '../services/db';

interface IdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  idea: Idea | null;
  currentUser: User;
  refreshData: () => void;
}

const IdeaModal: React.FC<IdeaModalProps> = ({ isOpen, onClose, idea, currentUser, refreshData }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [status, setStatus] = useState<IdeaStatus>(IdeaStatus.BACKLOG);

  useEffect(() => {
    if (idea) {
      setTitle(idea.title);
      setDescription(idea.description);
      setStatus(idea.status);
      setComments(idea.comments || []);
    }
  }, [idea, isOpen]);

  if (!isOpen || !idea) return null;

  const handleSave = () => {
    dbService.updateIdea(idea.id, {
      title,
      description,
      status
    });
    refreshData();
    onClose();
  };

  const handleDelete = async () => {
    if (window.confirm('Czy na pewno chcesz usunąć tę kartę? Tej operacji nie można cofnąć.')) {
      try {
        await dbService.deleteIdea(idea.id);
        onClose();
      } catch (error) {
        console.error("Error deleting idea:", error);
        alert("Wystąpił błąd podczas usuwania.");
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !idea) return;
    
    const addedComment = await dbService.addIdeaComment(idea.id, newComment, currentUser);
    setComments(prev => [...prev, addedComment]);
    setNewComment('');
  };

  const getStatusLabel = (s: IdeaStatus) => {
      switch(s) {
          case IdeaStatus.BACKLOG: return 'Backlog';
          case IdeaStatus.TODO: return 'Do Realizacji';
          case IdeaStatus.CHANGES_REQUIRED: return 'Do Zmiany';
          case IdeaStatus.REJECTED: return 'Odrzucone';
          default: return s;
      }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Left: Idea Details */}
        <div className="w-1/2 bg-gray-50 p-8 flex flex-col border-r border-gray-200 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Lightbulb className="text-yellow-500" />
              Szczegóły Pomysłu
            </h3>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white border border-gray-200 text-gray-600">
                {getStatusLabel(status)}
            </span>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-6 flex items-start gap-3">
            <div className="bg-indigo-100 p-2 rounded-full text-indigo-600 mt-0.5">
                <AlertTriangle size={18} />
            </div>
            <div>
                <h4 className="text-sm font-bold text-indigo-900">Inspiracja / Kierunek</h4>
                <p className="text-xs text-indigo-700 mt-1">
                    To jest tylko koncepcja, a nie gotowa treść posta. Użyj tego miejsca do brainstormingu i ustalenia kierunku wizualnego przed rozpoczęciem produkcji.
                </p>
            </div>
          </div>

          <div className="space-y-6 flex-1">
             <div>
               <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tytuł Pomysłu</label>
               <input 
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg font-medium"
               />
             </div>
             
             <div className="flex-1 flex flex-col">
               <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Opis koncepcji / Notatki</label>
               <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[200px] text-sm leading-relaxed resize-none"
                  placeholder="Opisz na czym polega pomysł, jakie emocje ma wywoływać, jakie zdjęcia wykonać..."
               />
             </div>
          </div>
          
          <div className="pt-8 flex gap-3">
             <button 
               onClick={handleDelete}
               className="p-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
               title="Usuń kartę"
             >
               <Trash2 size={20} />
             </button>
             <button onClick={handleSave} className="flex-1 bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition">
               Zapisz Zmiany
             </button>
          </div>
        </div>

        {/* Right: Comments & Discussion */}
        <div className="w-1/2 flex flex-col bg-white">
           <div className="flex justify-between items-center p-6 border-b border-gray-100">
             <h4 className="font-bold text-gray-800 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-yellow-400"></span> Dyskusja o koncepcji
             </h4>
             <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
               <X size={24} />
             </button>
           </div>

           <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
             {comments.length === 0 ? (
               <div className="text-center text-gray-400 mt-20">
                 <Lightbulb size={48} className="mx-auto mb-4 opacity-20" />
                 <p>Brak komentarzy.</p>
                 <p className="text-xs">Rozpocznij dyskusję o tym pomyśle.</p>
               </div>
             ) : (
               comments.map(comment => (
                 <div key={comment.id} className={`flex gap-3 ${comment.userId === currentUser.id ? 'flex-row-reverse' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold text-xs border border-yellow-200 flex-shrink-0">
                      {comment.userName.charAt(0)}
                    </div>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${comment.userId === currentUser.id ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none'}`}>
                      <p className="font-semibold text-[10px] opacity-70 mb-1">{comment.userName}</p>
                      {comment.text}
                    </div>
                 </div>
               ))
             )}
           </div>

           <div className="p-4 border-t border-gray-100 bg-white">
               <form onSubmit={handleAddComment} className="flex gap-2">
                <input 
                  type="text" 
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Dodaj uwagę do pomysłu..."
                  className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
                <button type="submit" className="w-12 h-12 bg-indigo-600 rounded-full text-white flex items-center justify-center hover:bg-indigo-700 transition shadow-md">
                   <Send size={18} />
                </button>
               </form>
           </div>
        </div>
      </div>
    </div>
  );
};

export default IdeaModal;
