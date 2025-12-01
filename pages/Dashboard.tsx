
import React, { useState, useEffect } from 'react';
import { Idea, IdeaStatus, IdeaVariant } from '../types';
import { dbService } from '../services/db';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Dashboard: React.FC = () => {
  const [kanbanPosts, setKanbanPosts] = useState<Idea[]>([]);
  const [topics, setTopics] = useState<Idea[]>([]);

  useEffect(() => {
    // Subscribe to "Posty" (Kanban variant) instead of old Repository "posts"
    const unsubPosts = dbService.subscribeToIdeas(IdeaVariant.POST, setKanbanPosts);
    // Subscribe to "Tematy"
    const unsubTopics = dbService.subscribeToIdeas(IdeaVariant.TOPIC, setTopics);
    
    return () => {
      unsubPosts();
      unsubTopics();
    };
  }, []);

  // Calculate Stats based on Kanban Statuses
  const todoCount = kanbanPosts.filter(p => p.status === IdeaStatus.TODO).length;
  const changesCount = kanbanPosts.filter(p => p.status === IdeaStatus.CHANGES_REQUIRED).length;
  const backlogCount = kanbanPosts.filter(p => p.status === IdeaStatus.BACKLOG).length;
  const rejectedCount = kanbanPosts.filter(p => p.status === IdeaStatus.REJECTED).length;
  
  const totalTopics = topics.length;

  const data = [
    { name: 'Backlog', value: backlogCount },
    { name: 'Do Realizacji', value: todoCount },
    { name: 'Do Zmiany', value: changesCount },
    { name: 'Odrzucone', value: rejectedCount },
  ];

  const COLORS = ['#94a3b8', '#3b82f6', '#f97316', '#ef4444'];

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <p className="text-sm text-gray-500 font-medium">Posty: Do Realizacji</p>
           <h3 className="text-3xl font-bold text-gray-800 mt-2">{todoCount}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <p className="text-sm text-gray-500 font-medium">Posty: Do Zmiany</p>
           <h3 className="text-3xl font-bold text-gray-800 mt-2">{changesCount}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <p className="text-sm text-gray-500 font-medium">Tematy (Inspiracje)</p>
           <h3 className="text-3xl font-bold text-gray-800 mt-2">{totalTopics}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[350px]">
           <h4 className="text-lg font-bold text-gray-800 mb-6">Status Postów (Kanban)</h4>
           <ResponsiveContainer width="100%" height="85%">
             <BarChart data={data}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} />
               <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
               <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
               <Tooltip cursor={{fill: 'transparent'}} />
               <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                 {data.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                 ))}
               </Bar>
             </BarChart>
           </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
