import React, { useState } from 'react';
import Layout from './components/Layout';
import IdeaBank from './pages/IdeaBank';
import Repository from './pages/Repository';
import CalendarView from './pages/CalendarView';
import Dashboard from './pages/Dashboard';
import PostModal from './components/PostModal';
import { MOCK_USER_ADMIN, MOCK_USER_CLIENT, User, Post } from './types';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USER_ADMIN);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const switchUser = () => {
    setCurrentUser(prev => prev.id === MOCK_USER_ADMIN.id ? MOCK_USER_CLIENT : MOCK_USER_ADMIN);
  };

  const openNewPostModal = () => {
    setEditingPost(null);
    setIsModalOpen(true);
  };

  const openEditPostModal = (post: Post) => {
    setEditingPost(post);
    setIsModalOpen(true);
  };

  const renderPage = () => {
    switch(currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'ideas': return <IdeaBank currentUser={currentUser} />;
      case 'repository': return <Repository currentUser={currentUser} onEditPost={openEditPostModal} onNewPost={openNewPostModal} />;
      case 'calendar': return <CalendarView onEditPost={openEditPostModal} />;
      case 'analytics': return <Dashboard />; // Reuse dashboard for now
      default: return <Dashboard />;
    }
  };

  return (
    <Layout 
      currentUser={currentUser} 
      setCurrentPage={setCurrentPage} 
      currentPage={currentPage}
      switchUser={switchUser}
    >
      {renderPage()}
      
      {isModalOpen && (
        <PostModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          post={editingPost}
          currentUser={currentUser}
          refreshData={() => {
            // In a real app with React Query, invalidation happens here. 
            // In our mock/storage setup, components will auto-refresh via internal state/subscriptions,
            // or we force a re-render. Since Repository uses polling/loading on mount, simple close is fine.
            // But to be sure, we can trigger a global refresh event if needed.
          }}
        />
      )}
    </Layout>
  );
}

export default App;