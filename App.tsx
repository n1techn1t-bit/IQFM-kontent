
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import IdeaBank from './pages/IdeaBank';
import Repository from './pages/Repository';
import CalendarView from './pages/CalendarView';
import Dashboard from './pages/Dashboard';
import PostModal from './components/PostModal';
import IdeaModal from './components/IdeaModal';
import { MOCK_USER_ADMIN, MOCK_USER_CLIENT, User, Post, IdeaVariant, Idea } from './types';

function App() {
  // Check if we are on the client specific route
  // We check for both path (if server supports it) and hash (fallback for static servers)
  const isClientRoute = window.location.pathname === '/iqfm' || window.location.hash === '#/iqfm' || window.location.hash === '#iqfm';

  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // Initialize user based on the route
  const [currentUser, setCurrentUser] = useState<User>(
    isClientRoute ? MOCK_USER_CLIENT : MOCK_USER_ADMIN
  );
  
  // PostModal state (Old Repository)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // IdeaModal state (Kanban / Calendar)
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);

  const switchUser = () => {
    // Disable switch user if on restricted route, although button is hidden UI side too
    if (isClientRoute) return;
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

  const openIdeaModal = (idea: Idea) => {
    setSelectedIdea(idea);
    setIsIdeaModalOpen(true);
  };

  const renderPage = () => {
    switch(currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'topics': return <IdeaBank currentUser={currentUser} variant={IdeaVariant.TOPIC} />;
      case 'kanban_posts': return <IdeaBank currentUser={currentUser} variant={IdeaVariant.POST} />;
      case 'repository': return <Repository currentUser={currentUser} onEditPost={openEditPostModal} onNewPost={openNewPostModal} />;
      case 'calendar': return <CalendarView onEditIdea={openIdeaModal} />;
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
      hideRoleSwitch={isClientRoute}
    >
      {renderPage()}
      
      {/* Old Repository Modal */}
      {isModalOpen && (
        <PostModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          post={editingPost}
          currentUser={currentUser}
          refreshData={() => {
            // Data auto-refreshes via subscriptions
          }}
        />
      )}

      {/* Kanban / Calendar Idea Modal */}
      {isIdeaModalOpen && (
        <IdeaModal 
          isOpen={isIdeaModalOpen}
          onClose={() => setIsIdeaModalOpen(false)}
          idea={selectedIdea}
          currentUser={currentUser}
          refreshData={() => {
             // Data auto-refreshes via subscriptions
          }} 
        />
      )}
    </Layout>
  );
}

export default App;
