
import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, addMonths, subMonths } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Idea, IdeaVariant, IdeaStatus, PostCategory } from '../types';
import { dbService } from '../services/db';

interface CalendarViewProps {
  onEditIdea: (idea: Idea) => void; 
}

const CalendarView: React.FC<CalendarViewProps> = ({ onEditIdea }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<Idea[]>([]);

  useEffect(() => {
    // Subscribe to Ideas with POST variant
    const unsubscribe = dbService.subscribeToIdeas(IdeaVariant.POST, (fetchedIdeas) => {
        setPosts(fetchedIdeas);
    });
    return () => unsubscribe();
  }, []);

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const startDay = getDay(startOfMonth(currentDate)); // 0 = Sunday
  // Adjust for Monday start (Polish locale standard)
  const emptyDays = startDay === 0 ? 6 : startDay - 1;

  const getPostsForDay = (date: Date) => {
    return posts.filter(post => 
      post.scheduledDate && isSameDay(new Date(post.scheduledDate), date)
    );
  };

  const getStatusColor = (status: IdeaStatus) => {
    switch(status) {
        case IdeaStatus.TODO: return 'bg-blue-500';
        case IdeaStatus.CHANGES_REQUIRED: return 'bg-orange-500';
        case IdeaStatus.BACKLOG: return 'bg-gray-300';
        case IdeaStatus.REJECTED: return 'bg-red-500';
        default: return 'bg-gray-400';
    }
  };

  const getCategoryStyles = (category?: PostCategory) => {
    switch(category) {
        case PostCategory.REELS: return { border: 'border-purple-200', bg: 'bg-purple-50', text: 'text-purple-700', label: 'Reels' };
        case PostCategory.STORY: return { border: 'border-pink-200', bg: 'bg-pink-50', text: 'text-pink-700', label: 'Story' };
        case PostCategory.POST: return { border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-700', label: 'Post' };
        default: return { border: 'border-gray-200', bg: 'bg-white', text: 'text-gray-600', label: '' };
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: pl })}
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-gray-100 rounded-full transition">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-gray-100 rounded-full transition">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Grid Header */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map(day => (
          <div key={day} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Grid Body */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-gray-200 gap-px">
        {Array.from({ length: emptyDays }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-white" />
        ))}
        
        {days.map(day => {
          const dayPosts = getPostsForDay(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div key={day.toString()} className={`bg-white p-2 min-h-[120px] flex flex-col transition hover:bg-gray-50 ${isToday ? 'bg-indigo-50/30' : ''}`}>
              <div className="flex justify-between items-start mb-2">
                 <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-gray-700'}`}>
                   {format(day, 'd')}
                 </span>
                 {dayPosts.length > 0 && <span className="text-xs text-gray-400">{dayPosts.length}</span>}
              </div>
              
              <div className="flex-1 space-y-1 overflow-y-auto">
                {dayPosts.map(post => {
                  const styles = getCategoryStyles(post.category);
                  
                  return (
                    <div 
                      key={post.id}
                      onClick={() => onEditIdea(post)}
                      className={`w-full text-left border shadow-sm rounded-md p-2 hover:shadow-md transition group cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[50px]
                          ${styles.bg} ${styles.border}
                      `}
                    >
                      <div className="flex items-center gap-1.5 mb-1 relative z-10">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(post.status)}`}></div>
                        <span className="text-[10px] text-gray-500 truncate font-mono">{format(new Date(post.scheduledDate!), 'HH:mm')}</span>
                      </div>
                      
                      <p className={`text-xs font-medium truncate relative z-10 ${styles.text}`}>
                        {post.title}
                      </p>

                      {styles.label && (
                        <span className={`absolute bottom-0.5 right-1.5 text-[8px] font-bold uppercase tracking-wider opacity-60 ${styles.text}`}>
                           {styles.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
