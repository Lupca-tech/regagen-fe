


import { initializeApp, type FirebaseApp, type FirebaseError } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  deleteUser,
  setPersistence, // Added setPersistence
  indexedDBLocalPersistence, // Added indexedDBLocalPersistence
  type User,
  type Auth
} from 'firebase/auth';
import { 
    getFirestore,
    collection,
    addDoc,
    doc,
    getDoc,
    query,
    where,
    getDocs,
    orderBy,
    serverTimestamp,
    writeBatch,
    updateDoc,
    deleteDoc,
    setDoc,
    Timestamp,
    type Firestore,
    type QueryDocumentSnapshot,
    type DocumentData
} from 'firebase/firestore';
import {
    getStorage,
    ref,
    uploadString,
    getDownloadURL,
    type Storage
} from 'firebase/storage';
import type { GeneratedContent, SavedContent, Project, Campaign, Topic, BrandVoiceProfile, PerformanceAnalysis, CalendarSettings, CalendarEvent } from '../types';


// User-provided Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCadAncVr5lpkVGL-eXGV9xnr73rW8SvMY",
  authDomain: "regagen.firebaseapp.com",
  projectId: "regagen",
  storageBucket: "regagen.appspot.com",
  messagingSenderId: "346012191789",
  appId: "1:346012191789:web:4301d9b0de0003c476fca4",
  measurementId: "G-MJ3YSDD5YC"
};


// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);

// Set Firebase Auth persistence to IndexedDB to prevent "missing initial state" errors
// with cross-origin authentication flows (e.g., app on Vercel, auth on firebaseapp.com)
setPersistence(auth, indexedDBLocalPersistence)
  .then(() => {
    console.log("Firebase Auth persistence set to indexedDBLocalPersistence.");
  })
  .catch((error) => {
    console.error("Failed to set Firebase Auth persistence:", error);
  });

const db: Firestore = getFirestore(app);
const storage: Storage = getStorage(app);


const getFirebaseAuthErrorMessage = (error: FirebaseError) => {
  switch (error.code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid credentials. Please check your email and password.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

const createDefaultProjectForUser = async (user: User) => {
    try {
        const projectsQuery = query(collection(db, "projects"), where("userId", "==", user.uid));
        const existingProjects = await getDocs(projectsQuery);
        if (existingProjects.empty) {
            console.log(`Creating default project for new user: ${user.uid}`);
            await addDoc(collection(db, "projects"), {
                userId: user.uid,
                name: "Default Project",
                description: "Your first project for generating amazing content.",
                createdAt: serverTimestamp()
            });
        }
    } catch (error) {
        console.error("CRITICAL: Failed to create default project for user.", error);
        throw new Error("Account created, but failed to set up initial project. This might be due to database permissions.");
    }
};

export const signUpWithEmailAndPassword = async (email: string, password: string, displayName: string) => {
    let userCredential;
    try {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
    } catch (authError) {
        throw new Error(getFirebaseAuthErrorMessage(authError as FirebaseError));
    }
    
    try {
        await createDefaultProjectForUser(userCredential.user);
    } catch (firestoreError) {
        console.error("Firestore setup failed after user creation, but the authentication account was created successfully.", firestoreError);
        if (firestoreError instanceof Error) {
            throw firestoreError;
        }
        throw new Error("Account created, but a database error occurred during initial setup.");
    }
    
    return userCredential;
};

export const signInWithEmail = async (email: string, password: string) => {
    try {
        return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        throw new Error(getFirebaseAuthErrorMessage(error as FirebaseError));
    }
};


export const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    let result;
    try {
       result = await signInWithPopup(auth, provider);
    } catch(authError) {
        console.error("Google Sign-In failed:", authError);
        throw new Error(getFirebaseAuthErrorMessage(authError as FirebaseError));
    }
    
    try {
        await createDefaultProjectForUser(result.user);
    } catch (firestoreError) {
        console.error("Firestore setup failed after Google sign-in, but the authentication was successful.", firestoreError);
        if (firestoreError instanceof Error) {
            throw firestoreError;
        }
        throw new Error("Signed in successfully, but a database error occurred during initial setup.");
    }
    return result;
};

export const signOutUser = () => {
    return signOut(auth);
};

export const onAuthStateChangedListener = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};

// --- Firestore CRUD for Project Management ---

const typedCollection = <T extends DocumentData>(docs: QueryDocumentSnapshot<DocumentData>[]): T[] => {
    return docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
}

const handleFirestoreError = (error: unknown, context: string): Error => {
    console.error(`Error ${context}:`, error);
    const firebaseError = error as FirebaseError;
    if (firebaseError.code === 'permission-denied' || firebaseError.code === 'failed-precondition') {
         return new Error(`Could not fetch data. Check Firestore security rules or for missing indexes.`);
    }
    return new Error(`An unexpected error occurred while fetching ${context}.`);
}

// PROJECTS
export const getProjects = async (userId: string): Promise<Project[]> => {
    try {
        const q = query(collection(db, "projects"), where("userId", "==", userId), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return typedCollection<Project>(snapshot.docs);
    } catch (error) {
        throw handleFirestoreError(error, 'projects');
    }
}
export const addProject = (data: Omit<Project, 'id' | 'createdAt'>) => addDoc(collection(db, "projects"), { ...data, createdAt: serverTimestamp() });
export const updateProject = (id: string, data: Partial<Project>) => updateDoc(doc(db, "projects", id), data);
export const deleteProject = async (id: string, userId: string) => {
    const batch = writeBatch(db);
    batch.delete(doc(db, "projects", id));

    const collectionsToQuery = ['campaigns', 'topics', 'generations'];
    const queries = collectionsToQuery.map(coll =>
        getDocs(query(collection(db, coll), where("projectId", "==", id), where("userId", "==", userId)))
    );
    
    const snapshots = await Promise.all(queries);
    snapshots.forEach(snapshot => snapshot.docs.forEach(d => batch.delete(d.ref)));
    await batch.commit();
};

// CAMPAIGNS
export const getCampaigns = async (projectId: string, userId: string): Promise<Campaign[]> => {
    try {
        const q = query(collection(db, "campaigns"), where("projectId", "==", projectId), where("userId", "==", userId), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return typedCollection<Campaign>(snapshot.docs);
    } catch (error) {
        throw handleFirestoreError(error, 'campaigns');
    }
}
export const getAllUserCampaigns = async (userId: string): Promise<Campaign[]> => {
    try {
        const q = query(collection(db, "campaigns"), where("userId", "==", userId));
        const snapshot = await getDocs(q);
        return typedCollection<Campaign>(snapshot.docs);
    } catch (error) {
        throw handleFirestoreError(error, 'all user campaigns');
    }
}
export const addCampaign = (data: Omit<Campaign, 'id' | 'createdAt'>) => addDoc(collection(db, "campaigns"), { ...data, createdAt: serverTimestamp() });
export const updateCampaign = (id: string, data: Partial<Campaign>) => updateDoc(doc(db, "campaigns", id), data);
export const deleteCampaign = async (id: string, userId: string) => {
    const batch = writeBatch(db);
    batch.delete(doc(db, "campaigns", id));
    
    const collectionsToQuery = ['topics', 'generations'];
    const queries = collectionsToQuery.map(coll =>
        getDocs(query(collection(db, coll), where("campaignId", "==", id), where("userId", "==", userId)))
    );

    const snapshots = await Promise.all(queries);
    snapshots.forEach(snapshot => snapshot.docs.forEach(d => batch.delete(d.ref)));
    await batch.commit();
};

// TOPICS
export const getTopics = async (campaignId: string, userId: string): Promise<Topic[]> => {
     try {
        const q = query(collection(db, "topics"), where("campaignId", "==", campaignId), where("userId", "==", userId), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return typedCollection<Topic>(snapshot.docs);
    } catch (error) {
        throw handleFirestoreError(error, 'topics');
    }
}
export const getAllUserTopics = async (userId: string): Promise<Topic[]> => {
    try {
        const q = query(collection(db, "topics"), where("userId", "==", userId));
        const snapshot = await getDocs(q);
        return typedCollection<Topic>(snapshot.docs);
    } catch (error) {
        throw handleFirestoreError(error, 'all user topics');
    }
}
export const addTopic = (data: Omit<Topic, 'id' | 'createdAt' | 'status'>) => addDoc(collection(db, "topics"), { ...data, status: 'Draft', createdAt: serverTimestamp() });
export const updateTopic = (id: string, data: Partial<Topic>) => updateDoc(doc(db, "topics", id), data);
export const deleteTopic = async (id: string, userId: string) => {
    const batch = writeBatch(db);
    batch.delete(doc(db, "topics", id));
    const generationsQuery = getDocs(query(collection(db, 'generations'), where("topicId", "==", id), where("userId", "==", userId)));
    const snapshots = await Promise.all([generationsQuery]);
    snapshots.forEach(snapshot => snapshot.docs.forEach(d => batch.delete(d.ref)));
    await batch.commit();
};
export const addMultipleTopics = async (topics: {name: string}[], userId: string, projectId: string, campaignId: string) => {
    const batch = writeBatch(db);
    topics.forEach(topic => {
        const newTopicRef = doc(collection(db, 'topics'));
        batch.set(newTopicRef, {
            ...topic,
            userId,
            projectId,
            campaignId,
            status: 'Draft',
            createdAt: serverTimestamp()
        });
    });
    await batch.commit();
}


// CONTENT (GENERATIONS)
export const saveGeneratedContent = async (userId: string, topicText: string, language: string, content: GeneratedContent, context: { projectId: string; campaignId: string; topicId: string; }) => {
    const docRef = doc(collection(db, "generations"));
    const { mainArticle, image, web, facebook, linkedin, x, tiktok, youtube, analysis } = content;

    await setDoc(docRef, {
        // Required fields from content
        mainArticle,
        image,
        // Optional fields from content, defaulting to null to avoid 'undefined' errors
        web: web || null,
        facebook: facebook || null,
        linkedin: linkedin || null,
        x: x || null,
        tiktok: tiktok || null,
        youtube: youtube || null,
        analysis: analysis || null,
        // Metadata fields
        id: docRef.id,
        userId,
        topic: topicText,
        language,
        projectId: context.projectId,
        campaignId: context.campaignId,
        topicId: context.topicId,
        createdAt: serverTimestamp()
    });
    
    await updateDoc(doc(db, "topics", context.topicId), { status: 'Generated', contentId: docRef.id });
}
export const getContentById = async (contentId: string): Promise<SavedContent | null> => {
    try {
        const docRef = doc(db, 'generations', contentId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as SavedContent;
        }
        return null;
    } catch (error) {
        throw handleFirestoreError(error, 'content');
    }
}
export const getUserContent = async (userId: string): Promise<SavedContent[]> => {
     try {
        const q = query(collection(db, "generations"), where("userId", "==", userId), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return typedCollection<SavedContent>(snapshot.docs);
    } catch (error) {
        throw handleFirestoreError(error, 'user content');
    }
}
export const updateContentAnalysis = (contentId: string, analysis: PerformanceAnalysis) => {
    const docRef = doc(db, 'generations', contentId);
    return updateDoc(docRef, { analysis });
};

// BRAND VOICE
export const getBrandVoiceProfiles = async (userId: string): Promise<BrandVoiceProfile[]> => {
    try {
        const q = query(collection(db, "brandVoiceProfiles"), where("userId", "==", userId), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return typedCollection<BrandVoiceProfile>(snapshot.docs);
    } catch (error) {
        throw handleFirestoreError(error, 'brand voice profiles');
    }
}
export const addBrandVoiceProfile = (data: Omit<BrandVoiceProfile, 'id' | 'createdAt'>) => addDoc(collection(db, "brandVoiceProfiles"), { ...data, createdAt: serverTimestamp() });
export const updateBrandVoiceProfile = (id: string, data: Partial<BrandVoiceProfile>) => updateDoc(doc(db, "brandVoiceProfiles", id), data);
export const deleteBrandVoiceProfile = (id: string) => deleteDoc(doc(db, "brandVoiceProfiles", id));


// --- CALENDAR ---
export const saveCalendarSettings = (userId: string, settings: Omit<CalendarSettings, 'userId'>) => {
    const docRef = doc(db, 'calendarSettings', userId);
    return setDoc(docRef, { ...settings, userId });
};

export const getCalendarSettings = async (userId: string): Promise<CalendarSettings | null> => {
    try {
        const docRef = doc(db, 'calendarSettings', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as CalendarSettings;
        }
        return null;
    } catch (error) {
        throw handleFirestoreError(error, 'calendar settings');
    }
};

export const getCalendarEvents = async (userId: string, startDate: Date, endDate: Date): Promise<CalendarEvent[]> => {
    try {
        const q = query(
            collection(db, "calendarEvents"),
            where("userId", "==", userId),
            where("start", ">=", Timestamp.fromDate(startDate)),
            where("start", "<=", Timestamp.fromDate(endDate)),
        );
        const snapshot = await getDocs(q);
        return typedCollection<CalendarEvent>(snapshot.docs);
    } catch (error) {
        throw handleFirestoreError(error, 'calendar events');
    }
};

export const addCalendarEventsBatch = async (userId: string, events: Omit<CalendarEvent, 'id' | 'userId'>[]) => {
    const batch = writeBatch(db);
    events.forEach(event => {
        const newEventRef = doc(collection(db, 'calendarEvents'));
        batch.set(newEventRef, {
            ...event,
            userId,
            start: Timestamp.fromDate(new Date(event.start)), // Ensure start is a Firestore Timestamp
        });
    });
    await batch.commit();
};

export const updateCalendarEvent = (eventId: string, data: Partial<CalendarEvent>) => {
    const docRef = doc(db, "calendarEvents", eventId);
    const dataToUpdate: any = { ...data };
    if (data.start) {
        dataToUpdate.start = Timestamp.fromDate(new Date(data.start));
    }
    return updateDoc(docRef, dataToUpdate);
};

export const deleteCalendarEvent = (eventId: string) => deleteDoc(doc(db, "calendarEvents", eventId));



// ACCOUNT MANAGEMENT
export const updateUserDisplayName = async (displayName: string) => {
    if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName });
    } else {
        throw new Error("No user is signed in.");
    }
};

export const sendPasswordReset = async () => {
    if (auth.currentUser && auth.currentUser.email) {
        await sendPasswordResetEmail(auth, auth.currentUser.email);
    } else {
        throw new Error("No signed-in user or email associated with the account.");
    }
};

export const deleteUserAccount = async (userId: string) => {
    const user = auth.currentUser;
    if (!user || user.uid !== userId) {
        throw new Error("Authentication error. Please sign in again to delete your account.");
    }
    
    // This is a simplified deletion. In a production app, you might want to use a Cloud Function
    // to recursively delete all user data from Firestore/Storage upon account deletion.
    console.warn("Deleting user account. Manual cleanup of Firestore/Storage data may be required if not handled by a backend function.");
    await deleteUser(user);
};

export type { User };