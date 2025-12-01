import React, { useState, useEffect } from 'react';
import { Plus, Filter, Search, MoreVertical, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { Post, PostStatus, User } from '../types';
import { dbService } from '../services/db';

interface RepositoryProps {
  currentUser: User;
  onEditPost: (post: Post) => void;
  onNewPost: () => void;
}

const Repository: React.FC<RepositoryProps> = ({ currentUser, onEditPost, onNewPost }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    // Real-time subscription
    const unsubscribe = dbService.subscribeToPosts((fetchedPosts) => {
      setPosts(fetchedPosts);
    });
    return () => unsubscribe();
  }, []);

  const getStatusColor = (status: PostStatus) => {
    switch (status) {
      case PostStatus.APPROVED: return 'bg-green-100 text-green-700 border-green-200';
      case PostStatus.PUBLISHED: return 'bg-blue-100 text-blue-700 border-blue-200';
      case PostStatus.NEEDS_REVISION: return 'bg-red-100 text-red-700 border-red-200';
      case PostStatus.PENDING_APPROVAL: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const filteredPosts = filterStatus === 'ALL' 
    ? posts 
    : posts.filter(p => p.status === filterStatus);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Repozytorium Postów</h2>
          <p className="text-gray-500">Zarządzaj gotowymi materiałami i procesem akceptacji.</p>
        </div>
        <button 
          onClick={onNewPost}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 shadow-md transition-all hover:shadow-lg"
        >
          <Plus size={18} /> Stwórz Post
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 bg-white p-2 rounded-xl shadow-sm border border-gray-100 w-fit">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Szukaj..." 
            className="pl-9 pr-4 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 w-64"
          />
        </div>
        <div className="h-6 w-px bg-gray-200"></div>
        <select 
          className="bg-transparent text-sm font-medium text-gray-600 focus:outline-none cursor-pointer"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="ALL">Wszystkie Statusy</option>
          <option value={PostStatus.DRAFT}>Szkice</option>
          <option value={PostStatus.PENDING_APPROVAL}>Do Akceptacji</option>
          <option value={PostStatus.APPROVED}>Zaakceptowane</option>
          <option value={PostStatus.NEEDS_REVISION}>Wymaga Poprawy</option>
          <option value={PostStatus.PUBLISHED}>Opublikowane</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
        {filteredPosts.map(post => (
          <div 
            key={post.id} 
            className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col h-full"
            onClick={() => onEditPost(post)}
          >
            {/* Image Preview */}
            <div className="aspect-square bg-gray-100 relative overflow-hidden">
               <img src={post.mediaUrl} alt="Post preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               <div className="absolute top-3 right-3">
                 <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(post.status)}`}>
                   {post.status.replace('_', ' ')}
                 </span>
               </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col">
               <p className="text-gray-800 text-sm line-clamp-3 mb-4 flex-1">
                 {post.caption || <span className="text-gray-400 italic">Brak opisu...</span>}
               </p>
               
               <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                 <div className="flex items-center gap-2 text-gray-500">
                    <MessageSquare size={16} />
                    <span className="text-xs font-medium">{post.comments.length}</span>
                 </div>
                 
                 <div className="flex gap-1">
                   {post.tags.slice(0, 2).map(tag => (
                     <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-md">{tag}</span>
                   ))}
                 </div>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Repository;