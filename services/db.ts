import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  query, 
  orderBy,
  arrayUnion,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { 
  Idea, 
  IdeaStatus, 
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
  // --- IDEAS ---

  // Real-time listener for Ideas
  subscribeToIdeas: (callback: (ideas: Idea[]) => void) => {
    const q = query(collection(db, "ideas"), orderBy("createdAt", "desc"));
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
      comments: []
    });
  },

  addIdeaComment: async (ideaId: string, text: string, user: User) => {
    const ref = doc(db, "ideas", ideaId);
    const newComment: Comment = {
      id: `ci_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      text,
      createdAt: Date.now() // We keep number for sub-objects usually, or map it. Firestore saves numbers fine in maps.
    };
    await updateDoc(ref, {
      comments: arrayUnion(newComment)
    });
    return newComment;
  },

  // --- POSTS ---

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
    
    // Logic for version incrementing would ideally require a transaction or reading current doc first,
    // for simplicity we just update here. In a real app we might read before write.
    // For this demo, we skip manual version increment or we could do it if we read the doc first.
    // We will just update the timestamp.

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

  deletePost: async (postId: string) => {
     await deleteDoc(doc(db, "posts", postId));
  }
};