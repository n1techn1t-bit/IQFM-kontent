import React, { useState, useEffect } from 'react';
import { Post, Idea, IdeaStatus, PostStatus } from '../types';
import { dbService } from '../services/db';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Dashboard: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);

  useEffect(() => {
    const unsubPosts = dbService.subscribeToPosts(setPosts);
    const unsubIdeas = dbService.subscribeToIdeas(setIdeas);
    return () => {
      unsubPosts();
      unsubIdeas();
    };
  }, []);

  // Calculate Stats
  const approvedCount = posts.filter(p => p.status === PostStatus.APPROVED || p.status === PostStatus.PUBLISHED).length;
  const pendingCount = posts.filter(p => p.status === PostStatus.PENDING_APPROVAL).length;
  const publishedCount = posts.filter(p => p.status === PostStatus.PUBLISHED).length;
  
  const rejectedIdeas = ideas.filter(i => i.status === IdeaStatus.REJECTED).length;
  const totalIdeas = ideas.length;
  const rejectionRate = totalIdeas > 0 ? Math.round((rejectedIdeas / totalIdeas) * 100) : 0;

  const data = [
    { name: 'Szkice', value: posts.filter(p => p.status === PostStatus.DRAFT).length },
    { name: 'Do Akceptacji', value: pendingCount },
    { name: 'Zatwierdzone', value: approvedCount },
    { name: 'Opublikowane', value: publishedCount },
  ];

  const COLORS = ['#94a3b8', '#facc15', '#4ade80', '#3b82f6'];

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <p className="text-sm text-gray-500 font-medium">Posty Opublikowane</p>
           <h3 className="text-3xl font-bold text-gray-800 mt-2">{publishedCount}</h3>
           <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full mt-2 inline-block">+2 w tym tygodniu</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <p className="text-sm text-gray-500 font-medium">Do Akceptacji</p>
           <h3 className="text-3xl font-bold text-gray-800 mt-2">{pendingCount}</h3>
           <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full mt-2 inline-block">Wymaga uwagi</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <p className="text-sm text-gray-500 font-medium">Baza Pomysłów</p>
           <h3 className="text-3xl font-bold text-gray-800 mt-2">{totalIdeas}</h3>
           <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full mt-2 inline-block">Nowe inspiracje</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <p className="text-sm text-gray-500 font-medium">Wskaźnik Odrzuceń</p>
           <h3 className="text-3xl font-bold text-gray-800 mt-2">{rejectionRate}%</h3>
           <span className="text-xs text-gray-500 mt-2 inline-block">Pomysłów odrzuconych</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[350px]">
           <h4 className="text-lg font-bold text-gray-800 mb-6">Status Postów</h4>
           <ResponsiveContainer width="100%" height="85%">
             <BarChart data={data}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} />
               <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
               <YAxis fontSize={12} tickLine={false} axisLine={false} />
               <Tooltip cursor={{fill: 'transparent'}} />
               <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                 {data.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                 ))}
               </Bar>
             </BarChart>
           </ResponsiveContainer>
        </div>

        {/* Activity Feed */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[350px] overflow-hidden flex flex-col">
           <h4 className="text-lg font-bold text-gray-800 mb-4">Ostatnia Aktywność</h4>
           <div className="flex-1 overflow-y-auto space-y-4 pr-2">
             {[1,2,3,4,5].map(i => (
               <div key={i} className="flex gap-3 items-start p-3 hover:bg-gray-50 rounded-xl transition">
                 <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                   A
                 </div>
                 <div>
                   <p className="text-sm text-gray-800"><span className="font-semibold">Kreator</span> zaktualizował status posta "Jesienna kolekcja".</p>
                   <span className="text-xs text-gray-400">2 godziny temu</span>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;