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
  setPersistence,
  indexedDBLocalPersistence,
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
import type { GeneratedContent, SavedContent, Project, Campaign, Topic, BrandVoiceProfile, PerformanceAnalysis, CalendarSettings, CalendarEvent, AIVisibilitySettings, AIVisibilityResult } from '../types';
import { useState, useEffect } from 'react';


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
    // This is for debugging, can be removed in production
    // console.log("Firebase Auth persistence set to indexedDBLocalPersistence.");
  })
  .catch((error) => {
    console.error("Failed to set Firebase Auth persistence:", error);
  });

const db: Firestore = getFirestore(app);
const storage: Storage = getStorage(app);

// --- NEW FUNCTION for upcoming events notification ---
export const getUpcomingEvents = async (userId: string, days: number): Promise<CalendarEvent[]> => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today

        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + days); // e.g., 3 days from now

        const q = query(
            collection(db, "calendarEvents"),
            where("userId", "==", userId),
            where("start", ">=", Timestamp.fromDate(today)),
            where("start", "<=", Timestamp.fromDate(futureDate)),
            orderBy("start", "asc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            const startTimestamp = data.start as Timestamp;
            return {
                id: doc.id,
                ...data,
                start: startTimestamp.toDate().toISOString(),
            } as CalendarEvent;
        });
    } catch (error) {
        // This is a non-critical feature, so we log the error but don't throw to break the app.
        console.warn("Could not fetch upcoming events for notification:", error);
        return [];
    }
};

/**
 * Custom hook to manage and provide the authentication state.
 * It returns the current user, a loading state, and a list of upcoming events.
 */
export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[] | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (userState) => {
            setUser(userState);
            if (userState) {
                // Fetch upcoming events for notifications when user logs in
                const events = await getUpcomingEvents(userState.uid, 3);
                setUpcomingEvents(events);
            } else {
                setUpcomingEvents(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return { user, loading, upcomingEvents };
};


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

// Deprecated in favor of the useAuth hook for component usage.
// Kept for potential non-component logic if needed in the future.
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
    if (firebaseError.code === 'permission-denied') {
        return new Error(`Permission Denied: Could not access ${context}. Please check your Firestore security rules to ensure you have the correct permissions.`);
    }
    if (firebaseError.code === 'failed-precondition') {
        return new Error(`Failed Precondition: This operation was rejected for ${context}. It's often due to a missing Firestore index. Please check the Firebase console for index creation links in the error logs.`);
    }
    return new Error(`An unexpected error occurred while fetching ${context}.`);
}

const handleFirestoreCreateError = (error: unknown, context: string, collectionPath: string): Error => {
    console.error(`Error creating ${context}:`, error);
    const firebaseError = error as FirebaseError;
    if (firebaseError.code === 'permission-denied') {
        const detailedError = `Permission Denied: Could not create a new ${context}.\n\nThis is a common issue with Firestore Security Rules. For a 'create' operation, your rule must check the incoming data ('request.resource.data') not the existing data ('resource.data').\n\nPlease use a rule similar to this in your Firebase Console -> Firestore -> Rules:\n\nmatch /${collectionPath}/{documentId} {\n  allow create: if request.auth.uid == request.resource.data.userId;\n  // ... add other rules for read, update, delete\n}`;
        return new Error(detailedError);
    }
    // Fallback to the generic handler for other types of errors
    return handleFirestoreError(error, `creating ${context}`);
};

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
export const addProject = async (data: Omit<Project, 'id' | 'createdAt'>) => {
    try {
        return await addDoc(collection(db, "projects"), { ...data, createdAt: serverTimestamp() });
    } catch (error) {
        throw handleFirestoreCreateError(error, 'project', 'projects');
    }
};
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
export const addCampaign = async (data: Omit<Campaign, 'id' | 'createdAt'>) => {
    try {
        return await addDoc(collection(db, "campaigns"), { ...data, createdAt: serverTimestamp() });
    } catch (error) {
        throw handleFirestoreCreateError(error, 'campaign', 'campaigns');
    }
};
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
export const addTopic = async (data: Omit<Topic, 'id' | 'createdAt' | 'status'>) => {
    try {
        return await addDoc(collection(db, "topics"), { ...data, status: 'Draft', createdAt: serverTimestamp() });
    } catch (error) {
        throw handleFirestoreCreateError(error, 'topic', 'topics');
    }
};
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
    try {
        await batch.commit();
    } catch (error) {
        throw handleFirestoreCreateError(error, 'topics', 'topics');
    }
}


/**
 * Uploads an image to Firebase Storage if it's a data URL, otherwise returns the URL as is.
 * @param userId The user's ID.
 * @param contentId The ID of the content document this image belongs to.
 * @param imageIndex The index of the image in the content's image array.
 * @param imageUrl The image URL, which can be a data URL (base64) or a regular http/https URL.
 * @returns The publicly accessible download URL from Firebase Storage or the original http/https URL.
 */
const uploadImageToStorage = async (userId: string, contentId: string, imageIndex: number, imageUrl: string): Promise<string> => {
    if (!imageUrl || !imageUrl.startsWith('data:image/')) {
        // If it's not a data URL (e.g., the picsum.photos fallback), return it directly.
        return imageUrl;
    }

    try {
        // Create a reference in Firebase Storage
        const storageRef = ref(storage, `images/${userId}/${contentId}/${Date.now()}_${imageIndex}.png`);
        
        // Upload the base64 data URL string
        const snapshot = await uploadString(storageRef, imageUrl, 'data_url');
        
        // Get the public download URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        return downloadURL;
    } catch (error) {
        console.error("Error uploading image to Firebase Storage:", error);
        // If upload fails, fall back to a default placeholder. This provides a second layer of fallback.
        return `https://picsum.photos/seed/${contentId}/${imageIndex}/1024/768`;
    }
};


// CONTENT (GENERATIONS)
export const saveGeneratedContent = async (userId: string, topicText: string, language: string, content: GeneratedContent, context: { projectId: string; campaignId: string; topicId: string; }): Promise<string> => {
    const docRef = doc(collection(db, "generations"));
    const contentId = docRef.id;

    // Process and upload images to Firebase Storage
    const uploadedImages = [];
    if (Array.isArray(content.images) && content.images.length > 0) {
        // Use Promise.all to upload images in parallel for better performance
        const uploadPromises = content.images.map((img, index) => 
            uploadImageToStorage(userId, contentId, index, img.url)
        );
        const finalUrls = await Promise.all(uploadPromises);

        for (let i = 0; i < finalUrls.length; i++) {
            uploadedImages.push({
                url: finalUrls[i],
                prompt: content.images[i].prompt || 'No prompt provided.'
            });
        }
    }

    // Explicitly create a clean object for Firestore to prevent "invalid nested entity" errors
    const dataToSave = {
        mainArticle: {
            title: content.mainArticle?.title || '',
            body: content.mainArticle?.body || ''
        },
        images: uploadedImages, // Use the new array with storage URLs
        web: content.web || null,
        facebook: content.facebook || null,
        linkedin: content.linkedin || null,
        x: content.x || null,
        tiktok: content.tiktok || null,
        youtube: content.youtube || null,
        analysis: content.analysis || null,
        id: contentId,
        userId,
        topic: topicText,
        language,
        projectId: context.projectId,
        campaignId: context.campaignId,
        topicId: context.topicId,
        createdAt: serverTimestamp()
    };

    try {
        await setDoc(docRef, dataToSave);
        
        await updateDoc(doc(db, "topics", context.topicId), { status: 'Generated', contentId: contentId });
        return contentId;
    } catch (error) {
        throw handleFirestoreCreateError(error, 'content generation', 'generations');
    }
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
export const addBrandVoiceProfile = async (data: Omit<BrandVoiceProfile, 'id' | 'createdAt'>) => {
    try {
        return await addDoc(collection(db, "brandVoiceProfiles"), { ...data, createdAt: serverTimestamp() });
    } catch (error) {
        throw handleFirestoreCreateError(error, 'brand voice profile', 'brandVoiceProfiles');
    }
};
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
        if ((error as FirebaseError).code === 'permission-denied') {
             throw new Error("Permission Denied: Could not fetch your calendar settings. Please ensure your Firestore security rules allow users to read their own document at 'calendarSettings/{userId}'. The document ID must match the user's ID.");
        }
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
        // Replace typedCollection with a manual map to convert Timestamp to ISO string
        return snapshot.docs.map(doc => {
            const data = doc.data();
            const startTimestamp = data.start as Timestamp;
            return {
                id: doc.id,
                ...data,
                start: startTimestamp.toDate().toISOString(),
            } as CalendarEvent;
        });
    } catch (error) {
        throw handleFirestoreError(error, 'calendar events');
    }
};

export const addCalendarEventsBatch = async (userId: string, events: Omit<CalendarEvent, 'id' | 'userId'>[]) => {
    try {
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
    } catch (error) {
        if ((error as FirebaseError).code === 'permission-denied') {
            const detailedError = `Permission Denied: Could not save AI suggestions to the calendar.\n\nThis is a common issue with Firestore Security Rules. For a 'create' operation, you must check against the incoming data ('request.resource.data') not the existing data ('resource.data').\n\nPlease use the following rule in your Firebase Console -> Firestore -> Rules:\n\nmatch /calendarEvents/{eventId} {\n  allow read, update, delete: if request.auth.uid == resource.data.userId;\n  allow create: if request.auth.uid == request.resource.data.userId;\n}`;
            throw new Error(detailedError);
        }
        throw handleFirestoreError(error, 'calendar events batch creation');
    }
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

export const deleteCalendarEventsBatch = async (eventIds: string[]) => {
    if (eventIds.length === 0) return;

    try {
        const batch = writeBatch(db);
        eventIds.forEach(id => {
            const eventRef = doc(db, "calendarEvents", id);
            batch.delete(eventRef);
        });
        await batch.commit();
    } catch (error) {
        throw handleFirestoreError(error, 'deleting calendar events batch');
    }
};


export const linkContentToCalendarEvent = (eventId: string, contentId:string) => {
    const docRef = doc(db, "calendarEvents", eventId);
    return updateDoc(docRef, {
        status: 'draft',
        contentId: contentId,
    });
};

// --- AI VISIBILITY (AIO) ---
export const saveAIVisibilitySettings = (userId: string, settings: Omit<AIVisibilitySettings, 'userId'>) => {
    const docRef = doc(db, 'aiVisibilitySettings', userId);
    // Create a clean object to avoid any undefined values being sent to Firestore
    const dataToSave = {
        userId,
        brandName: settings.brandName || '',
        domain: settings.domain || '',
        keywords: settings.keywords || [],
        competitors: settings.competitors || [],
        projectId: settings.projectId || null,
        brandVoiceProfileId: settings.brandVoiceProfileId || null,
    };
    return setDoc(docRef, dataToSave);
};


export const getAIVisibilitySettings = async (userId: string): Promise<AIVisibilitySettings | null> => {
    try {
        const docRef = doc(db, 'aiVisibilitySettings', userId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? (docSnap.data() as AIVisibilitySettings) : null;
    } catch (error) {
        throw handleFirestoreError(error, 'AI visibility settings');
    }
};

export const getAIVisibilityResults = async (userId: string): Promise<AIVisibilityResult[]> => {
    try {
        const q = query(collection(db, "aiVisibilityResults"), where("userId", "==", userId), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return typedCollection<AIVisibilityResult>(snapshot.docs);
    } catch (error) {
        throw handleFirestoreError(error, 'AI visibility results');
    }
};


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

// Utility to format Firestore Timestamp
export const formatFirestoreTimestamp = (timestamp: Timestamp | { seconds: number; nanoseconds: number }): string => {
    if (!timestamp) return 'N/A';
    const date = (timestamp instanceof Timestamp) ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};