
import React, { useState, useEffect } from 'react';
import { X, Send, Lightbulb, AlertTriangle, Trash2, Edit2, Check, Calendar, FileText } from 'lucide-react';
import { Idea, IdeaStatus, User, UserRole, Comment, IdeaVariant } from '../types';
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
  const [status, setStatus] = useState<IdeaStatus>(IdeaStatus.BACKLOG);
  const [scheduledDate, setScheduledDate] = useState('');

  // Edit Comment State
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    if (idea) {
      setTitle(idea.title);
      setDescription(idea.description);
      setStatus(idea.status);
      if (idea.scheduledDate) {
        setScheduledDate(new Date(idea.scheduledDate).toISOString().slice(0, 16));
      } else {
        setScheduledDate('');
      }
    }
  }, [idea, isOpen]);

  if (!isOpen || !idea) return null;

  const handleSave = () => {
    const timestamp = scheduledDate ? new Date(scheduledDate).getTime() : undefined;

    dbService.updateIdea(idea.id, {
      title,
      description,
      status,
      scheduledDate: timestamp
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
    
    await dbService.addIdeaComment(idea.id, newComment, currentUser);
    setNewComment('');
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('Usunąć komentarz?')) {
      await dbService.deleteIdeaComment(idea.id, commentId);
    }
  };

  const startEditingComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.text);
  };

  const saveEditedComment = async (commentId: string) => {
    if (!editingText.trim()) return;
    await dbService.updateIdeaComment(idea.id, commentId, editingText);
    setEditingCommentId(null);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingText('');
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

  const currentComments = idea.comments || [];
  const isPost = idea.variant === IdeaVariant.POST;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Left: Idea Details */}
        <div className="w-1/2 bg-gray-50 p-8 flex flex-col border-r border-gray-200 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              {isPost ? <FileText className="text-indigo-500" /> : <Lightbulb className="text-yellow-500" />}
              Szczegóły {isPost ? 'Posta' : 'Tematu'}
            </h3>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white border border-gray-200 text-gray-600">
                {getStatusLabel(status)}
            </span>
          </div>

          <div className={`border rounded-lg p-4 mb-6 flex items-start gap-3 ${isPost ? 'bg-blue-50 border-blue-100' : 'bg-indigo-50 border-indigo-100'}`}>
            <div className={`p-2 rounded-full mt-0.5 ${isPost ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}>
                <AlertTriangle size={18} />
            </div>
            <div>
                <h4 className={`text-sm font-bold ${isPost ? 'text-blue-900' : 'text-indigo-900'}`}>
                  {isPost ? 'Planowanie Publikacji' : 'Inspiracja / Kierunek'}
                </h4>
                <p className={`text-xs mt-1 ${isPost ? 'text-blue-700' : 'text-indigo-700'}`}>
                    {isPost 
                      ? 'Tutaj ustalasz datę publikacji posta. Po jej wybraniu post pojawi się w kalendarzu.' 
                      : 'To jest tylko koncepcja, a nie gotowa treść posta. Użyj tego miejsca do brainstormingu.'}
                </p>
            </div>
          </div>

          <div className="space-y-6 flex-1">
             <div>
               <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tytuł</label>
               <input 
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg font-medium"
               />
             </div>
             
             {isPost && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Data Publikacji</label>
                  <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="datetime-local"
                        value={scheduledDate}
                        onChange={e => setScheduledDate(e.target.value)}
                        className="w-full pl-10 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                  </div>
                </div>
             )}

             <div className="flex-1 flex flex-col">
               <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Opis / Treść</label>
               <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[200px] text-sm leading-relaxed resize-none"
                  placeholder={isPost ? "Wpisz treść posta (caption)..." : "Opisz koncepcję..."}
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
               <span className="w-2 h-2 rounded-full bg-yellow-400"></span> Dyskusja
             </h4>
             <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
               <X size={24} />
             </button>
           </div>

           <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
             {currentComments.length === 0 ? (
               <div className="text-center text-gray-400 mt-20">
                 <Lightbulb size={48} className="mx-auto mb-4 opacity-20" />
                 <p>Brak komentarzy.</p>
                 <p className="text-xs">Rozpocznij dyskusję.</p>
               </div>
             ) : (
               currentComments.map(comment => (
                 <div key={comment.id} className={`flex gap-3 ${comment.userId === currentUser.id ? 'flex-row-reverse' : ''} group`}>
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold text-xs border border-yellow-200 flex-shrink-0">
                      {comment.userName.charAt(0)}
                    </div>
                    
                    <div className={`max-w-[80%] flex flex-col ${comment.userId === currentUser.id ? 'items-end' : 'items-start'}`}>
                      {editingCommentId === comment.id ? (
                        <div className="flex flex-col gap-2 w-full min-w-[200px] animate-in fade-in zoom-in-95">
                           <textarea
                             value={editingText}
                             onChange={(e) => setEditingText(e.target.value)}
                             className="w-full p-2 text-sm border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                             rows={2}
                           />
                           <div className="flex gap-2 justify-end">
                             <button onClick={cancelEditComment} className="p-1 text-gray-500 hover:text-gray-700"><X size={14}/></button>
                             <button onClick={() => saveEditedComment(comment.id)} className="p-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"><Check size={14}/></button>
                           </div>
                        </div>
                      ) : (
                        <div className={`p-3 rounded-2xl text-sm relative group/bubble
                          ${comment.userId === currentUser.id 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none'}
                        `}>
                          <p className="font-semibold text-[10px] opacity-70 mb-1">{comment.userName}</p>
                          {comment.text}
                          
                          {/* Actions Overlay */}
                          {comment.userId === currentUser.id && (
                             <div className="absolute -bottom-6 right-0 hidden group-hover/bubble:flex items-center gap-1 bg-white shadow-sm border border-gray-100 rounded-full px-2 py-1 z-10">
                                <button 
                                  onClick={() => startEditingComment(comment)}
                                  className="p-1 text-gray-400 hover:text-indigo-600 transition"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="p-1 text-gray-400 hover:text-red-500 transition"
                                >
                                  <Trash2 size={12} />
                                </button>
                             </div>
                          )}
                        </div>
                      )}
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
                  placeholder="Dodaj uwagę..."
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
