
import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, addMonths, subMonths } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Idea, IdeaVariant, IdeaStatus, Post } from '../types';
import { dbService } from '../services/db';

interface CalendarViewProps {
  onEditPost: (post: Post) => void; // Keeping prop type for compatibility, though we might not use it directly for Ideas yet
}

const CalendarView: React.FC<CalendarViewProps> = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<Idea[]>([]);

  useEffect(() => {
    // Subscribe to Ideas with POST variant instead of old Repository Posts
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

  const getStatusDot = (status: IdeaStatus) => {
    switch(status) {
        case IdeaStatus.TODO: return 'bg-blue-500';
        case IdeaStatus.CHANGES_REQUIRED: return 'bg-orange-500';
        case IdeaStatus.BACKLOG: return 'bg-gray-300';
        case IdeaStatus.REJECTED: return 'bg-red-500';
        default: return 'bg-gray-400';
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
            <div key={day.toString()} className={`bg-white p-2 min-h-[100px] flex flex-col transition hover:bg-gray-50 ${isToday ? 'bg-indigo-50/30' : ''}`}>
              <div className="flex justify-between items-start mb-2">
                 <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-gray-700'}`}>
                   {format(day, 'd')}
                 </span>
                 {dayPosts.length > 0 && <span className="text-xs text-gray-400">{dayPosts.length}</span>}
              </div>
              
              <div className="flex-1 space-y-1 overflow-y-auto">
                {dayPosts.map(post => (
                  <div 
                    key={post.id}
                    className="w-full text-left bg-white border border-gray-200 shadow-sm rounded p-1.5 hover:border-indigo-300 transition group cursor-default"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${getStatusDot(post.status)}`}></div>
                      <span className="text-[10px] text-gray-500 truncate">{format(new Date(post.scheduledDate!), 'HH:mm')}</span>
                    </div>
                    <div className="flex gap-2 items-center">
                        <p className="text-xs text-gray-700 truncate font-medium">{post.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
