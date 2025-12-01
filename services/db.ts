
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  deleteDoc, 
  query, 
  orderBy,
  arrayUnion,
  where,
  getDocs,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { 
  Idea, 
  IdeaStatus, 
  IdeaVariant,
  Post, 
  PostStatus, 
  Comment, 
  User
} from '../types';

// Helper to convert Firestore timestamp to number (for our interface)
const convertTimestamps = (data: any) => {
  const result = { ...data };
  if (result.createdAt instanceof Timestamp) result.createdAt = result.createdAt.toMillis();
  if (result.updatedAt instanceof Timestamp) result.updatedAt = result.updatedAt.toMillis();
  if (result.scheduledDate instanceof Timestamp) result.scheduledDate = result.scheduledDate.toMillis();
  
  if (result.comments && Array.isArray(result.comments)) {
    result.comments = result.comments.map((c: any) => ({
      ...c,
      createdAt: c.createdAt instanceof Timestamp ? c.createdAt.toMillis() : c.createdAt
    }));
  }
  return result;
};

export const dbService = {
  // --- EXPORT ---
  exportDatabase: async () => {
    try {
      const ideasSnapshot = await getDocs(collection(db, "ideas"));
      const postsSnapshot = await getDocs(collection(db, "posts"));

      const data = {
        ideas: ideasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        posts: postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        exportDate: new Date().toISOString()
      };

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `iqfm_export_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Błąd podczas eksportu bazy danych. Sprawdź konsolę.");
    }
  },

  // --- IDEAS / TOPICS / KANBAN POSTS ---

  // Real-time listener for Ideas with variant filtering
  subscribeToIdeas: (variant: IdeaVariant, callback: (ideas: Idea[]) => void) => {
    // REMOVED orderBy("createdAt", "desc") to allow client-side manual sorting via 'order' field
    // and to prevent Firestore Index errors.
    const q = query(
      collection(db, "ideas"), 
      where("variant", "==", variant)
    );
    
    return onSnapshot(q, (snapshot) => {
      const ideas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestamps(doc.data())
      })) as Idea[];
      callback(ideas);
    });
  },

  updateIdeaStatus: async (id: string, newStatus: IdeaStatus) => {
    const ref = doc(db, "ideas", id);
    await updateDoc(ref, { status: newStatus });
  },

  updateIdea: async (id: string, updates: Partial<Idea>) => {
    const ref = doc(db, "ideas", id);
    await updateDoc(ref, updates);
  },

  addIdea: async (idea: Omit<Idea, 'id' | 'createdAt' | 'comments'>) => {
    await addDoc(collection(db, "ideas"), {
      ...idea,
      createdAt: Timestamp.now(),
      comments: [],
      order: Date.now() // Initialize order with timestamp to put it at the end by default
    });
  },

  deleteIdea: async (id: string) => {
    await deleteDoc(doc(db, "ideas", id));
  },

  addIdeaComment: async (ideaId: string, text: string, user: User) => {
    const ref = doc(db, "ideas", ideaId);
    const newComment: Comment = {
      id: `ci_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      text,
      createdAt: Date.now() 
    };
    await updateDoc(ref, {
      comments: arrayUnion(newComment)
    });
    return newComment;
  },

  deleteIdeaComment: async (ideaId: string, commentId: string) => {
    const ref = doc(db, "ideas", ideaId);
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) {
      const data = snapshot.data();
      const updatedComments = (data.comments || []).filter((c: Comment) => c.id !== commentId);
      await updateDoc(ref, { comments: updatedComments });
    }
  },

  updateIdeaComment: async (ideaId: string, commentId: string, newText: string) => {
    const ref = doc(db, "ideas", ideaId);
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) {
      const data = snapshot.data();
      const updatedComments = (data.comments || []).map((c: Comment) => 
        c.id === commentId ? { ...c, text: newText } : c
      );
      await updateDoc(ref, { comments: updatedComments });
    }
  },

  // --- POSTS (Repository items) ---

  // Real-time listener for Posts
  subscribeToPosts: (callback: (posts: Post[]) => void) => {
    const q = query(collection(db, "posts"), orderBy("updatedAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestamps(doc.data())
      })) as Post[];
      callback(posts);
    });
  },

  addPost: async (post: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'version'>) => {
    // Handle scheduledDate if present
    const dataToSave: any = {
      ...post,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      comments: [],
      version: 1
    };
    
    if (post.scheduledDate) {
      dataToSave.scheduledDate = Timestamp.fromMillis(post.scheduledDate);
    }

    await addDoc(collection(db, "posts"), dataToSave);
  },

  updatePost: async (id: string, updates: Partial<Post>) => {
    const ref = doc(db, "posts", id);
    
    const dataToUpdate: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    if (updates.scheduledDate) {
      dataToUpdate.scheduledDate = Timestamp.fromMillis(updates.scheduledDate);
    }
    
    await updateDoc(ref, dataToUpdate);
  },

  addComment: async (postId: string, text: string, user: User) => {
    const ref = doc(db, "posts", postId);
    const newComment: Comment = {
      id: `c_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      text,
      createdAt: Date.now()
    };
    await updateDoc(ref, {
      comments: arrayUnion(newComment)
    });
    return newComment;
  },

  deletePostComment: async (postId: string, commentId: string) => {
    const ref = doc(db, "posts", postId);
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) {
      const data = snapshot.data();
      const updatedComments = (data.comments || []).filter((c: Comment) => c.id !== commentId);
      await updateDoc(ref, { comments: updatedComments });
    }
  },

  updatePostComment: async (postId: string, commentId: string, newText: string) => {
    const ref = doc(db, "posts", postId);
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) {
      const data = snapshot.data();
      const updatedComments = (data.comments || []).map((c: Comment) => 
        c.id === commentId ? { ...c, text: newText } : c
      );
      await updateDoc(ref, { comments: updatedComments });
    }
  },

  deletePost: async (postId: string) => {
     await deleteDoc(doc(db, "posts", postId));
  }
};
