import React, { useState, useEffect } from 'react';
import { X, Send, User as UserIcon, Calendar, Upload, Check, AlertCircle } from 'lucide-react';
import { Post, PostStatus, User, UserRole, Comment } from '../types';
import { dbService } from '../services/db';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null; // null means new post
  currentUser: User;
  refreshData: () => void;
}

const PostModal: React.FC<PostModalProps> = ({ isOpen, onClose, post, currentUser, refreshData }) => {
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [newComment, setNewComment] = useState('');
  const [status, setStatus] = useState<PostStatus>(PostStatus.DRAFT);
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    if (post) {
      setCaption(post.caption);
      setMediaUrl(post.mediaUrl);
      setStatus(post.status);
      setComments(post.comments || []);
      if (post.scheduledDate) {
        setScheduledDate(new Date(post.scheduledDate).toISOString().slice(0, 16));
      } else {
        setScheduledDate('');
      }
    } else {
      // Defaults for new post
      setCaption('');
      setMediaUrl(`https://picsum.photos/600/600?random=${Date.now()}`); // Mock upload
      setStatus(PostStatus.DRAFT);
      setComments([]);
      setScheduledDate('');
    }
  }, [post, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const timestamp = scheduledDate ? new Date(scheduledDate).getTime() : undefined;
    
    if (post) {
      dbService.updatePost(post.id, {
        caption,
        mediaUrl,
        status,
        scheduledDate: timestamp
      });
    } else {
      dbService.addPost({
        caption,
        mediaUrl,
        status,
        tags: [],
        scheduledDate: timestamp
      });
    }
    refreshData();
    onClose();
  };

  const handleStatusChange = (newStatus: PostStatus) => {
    if (!post) return;
    dbService.updatePost(post.id, { status: newStatus });
    setStatus(newStatus);
    refreshData();
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !post) return;
    
    const addedComment = await dbService.addComment(post.id, newComment, currentUser);
    setComments(prev => [...prev, addedComment]);
    setNewComment('');
  };

  const canEdit = currentUser.role === UserRole.ADMIN || (currentUser.role === UserRole.CLIENT && status !== PostStatus.PUBLISHED);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Left: Media & Details */}
        <div className="w-1/2 bg-gray-50 p-8 flex flex-col border-r border-gray-200 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">{post ? 'Edytuj Post' : 'Nowy Post'}</h3>
            <div className="flex gap-2">
               {/* Status Badge */}
               <span className="px-3 py-1 rounded-full text-xs font-bold bg-white border border-gray-200 text-gray-600">
                  {status}
               </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2 mb-6 group relative">
             <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
               <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
               {canEdit && (
                 <button className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                    <span className="bg-black/50 px-4 py-2 rounded-lg backdrop-blur-md flex items-center gap-2">
                       <Upload size={16} /> Zmień Obraz
                    </span>
                 </button>
               )}
             </div>
          </div>

          <div className="space-y-4">
             <div>
               <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Opis (Caption)</label>
               <textarea 
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[120px] text-sm leading-relaxed"
                  placeholder="Napisz coś ciekawego..."
                  disabled={!canEdit}
               />
             </div>
             
             <div>
               <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Data Publikacji</label>
               <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={e => setScheduledDate(e.target.value)}
                    className="w-full pl-10 p-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500"
                    disabled={!canEdit}
                  />
               </div>
             </div>
          </div>
          
          <div className="mt-auto pt-8 flex gap-3">
             <button onClick={handleSave} className="flex-1 bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition">
               Zapisz Zmiany
             </button>
             {currentUser.role === UserRole.CLIENT && status === PostStatus.PENDING_APPROVAL && (
                <>
                  <button onClick={() => handleStatusChange(PostStatus.APPROVED)} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2">
                    <Check size={18} /> Akceptuj
                  </button>
                  <button onClick={() => handleStatusChange(PostStatus.NEEDS_REVISION)} className="flex-1 bg-red-100 text-red-700 border border-red-200 py-3 rounded-lg font-medium hover:bg-red-200 transition flex items-center justify-center gap-2">
                    <AlertCircle size={18} /> Poprawka
                  </button>
                </>
             )}
          </div>
        </div>

        {/* Right: Comments & History */}
        <div className="w-1/2 flex flex-col bg-white">
           <div className="flex justify-between items-center p-6 border-b border-gray-100">
             <h4 className="font-bold text-gray-800 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-green-500"></span> Komentarze i Historia
             </h4>
             <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
               <X size={24} />
             </button>
           </div>

           <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
             {comments.length === 0 ? (
               <div className="text-center text-gray-400 mt-20">
                 <p>Brak komentarzy.</p>
                 <p className="text-xs">Rozpocznij dyskusję o tym poście.</p>
               </div>
             ) : (
               comments.map(comment => (
                 <div key={comment.id} className={`flex gap-3 ${comment.userId === currentUser.id ? 'flex-row-reverse' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs border border-indigo-200 flex-shrink-0">
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
             {post ? (
               <form onSubmit={handleAddComment} className="flex gap-2">
                <input 
                  type="text" 
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Napisz komentarz..."
                  className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
                <button type="submit" className="w-12 h-12 bg-indigo-600 rounded-full text-white flex items-center justify-center hover:bg-indigo-700 transition shadow-md">
                   <Send size={18} />
                </button>
               </form>
             ) : (
               <p className="text-center text-xs text-gray-400">Zapisz post, aby dodawać komentarze.</p>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default PostModal;