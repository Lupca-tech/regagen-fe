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
import type { GeneratedContent, SavedContent, Project, Campaign, Topic, BrandVoiceProfile } from '../types';


// User-provided Firebase configuration
// IMPORTANT: Replace these placeholder values with your own Firebase project configuration.
// You can find this in your Firebase project settings.
const firebaseConfig = {
  apiKey: "AIzaSyCadAncVr5lpkVGL-eXGV9xnr73rW8SvMY",
  authDomain: "regagen.firebaseapp.com",
  projectId: "regagen",
  storageBucket: "regagen.appspot.com",
  messagingSenderId: "346012191789",
  appId: "1:346012191789:web:4301d9b0de0003c476fca4",
  measurementId: "G-MJ3YSDD5YC"
};


// Initialize Firebase conditionally
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: Storage | null = null;
let isFirebaseConfigured = false;

// Check if the configuration has been updated from placeholders
if (firebaseConfig.apiKey === "YOUR_API_KEY" || firebaseConfig.projectId === "YOUR_PROJECT_ID") {
    console.warn("Firebase is not configured. Please replace the placeholder values in 'services/firebaseService.ts' with your own Firebase project configuration. All authentication and database features will be disabled.");
} else {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
        isFirebaseConfigured = true;
    } catch (error) {
        console.error("Firebase initialization error. Please check if your configuration values are correct.", error);
    }
}

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
    if (!db) {
        console.warn("Firestore not available, skipping default project creation.");
        return;
    }
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
    if (!auth || !isFirebaseConfigured) {
        throw new Error("Authentication is not configured.");
    }
    let userCredential;
    try {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
    } catch (authError) {
        throw new Error(getFirebaseAuthErrorMessage(authError as FirebaseError));
    }
    
    // Auth succeeded, now handle Firestore data creation.
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
    if (!auth || !isFirebaseConfigured) {
        throw new Error("Authentication is not configured.");
    }
    try {
        return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        throw new Error(getFirebaseAuthErrorMessage(error as FirebaseError));
    }
};


export const signInWithGoogle = async () => {
    if (!auth || !isFirebaseConfigured) {
        const errorMessage = "Authentication is not configured. Please check your firebaseConfig in services/firebaseService.ts";
        console.error(errorMessage);
        alert(errorMessage);
        return Promise.reject(new Error(errorMessage));
    }
    const provider = new GoogleAuthProvider();
    let result;
    try {
       result = await signInWithPopup(auth, provider);
    } catch(authError) {
        console.error("Google Sign-In failed:", authError);
        throw new Error(getFirebaseAuthErrorMessage(authError as FirebaseError));
    }
    
    // Auth succeeded, now handle Firestore data creation.
    try {
        await createDefaultProjectForUser(result.user);
    } catch (firestoreError) {
        console.error("Firestore setup failed after Google sign-in, but the authentication was successful.", firestoreError);
        if (firestoreError instanceof Error) {
            throw firestoreError; // Re-throw the specific, informative error
        }
        throw new Error("Signed in successfully, but a database error occurred during initial setup.");
    }
    return result;
};

export const signOutUser = () => {
    if (!auth || !isFirebaseConfigured) return Promise.resolve();
    return signOut(auth);
};

export const onAuthStateChangedListener = (callback: (user: User | null) => void) => {
    if (!auth || !isFirebaseConfigured) {
        callback(null);
        return () => {}; // Return an empty unsubscribe function
    }
    return onAuthStateChanged(auth, callback);
};

// --- Firestore CRUD for Project Management ---

const typedCollection = <T extends DocumentData>(docs: QueryDocumentSnapshot<DocumentData>[]): T[] => {
    // FIX: Cast to `unknown` first to satisfy TypeScript's generic type checking.
    return docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
}

const handleFirestoreError = (error: unknown, context: string): Error => {
    console.error(`Error ${context}:`, error);
    const firebaseError = error as FirebaseError;
    if (firebaseError.code === 'permission-denied' || firebaseError.code === 'failed-precondition') {
         return new Error(`Could not fetch data. This is often due to Firestore security rules or a missing database index. Check the browser console for a link to create the required index.`);
    }
    return new Error(`An unexpected error occurred while fetching ${context}.`);
}

// PROJECTS
export const getProjects = async (userId: string): Promise<Project[]> => {
    if (!db) return [];
    try {
        const q = query(collection(db, "projects"), where("userId", "==", userId), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return typedCollection<Project>(snapshot.docs);
    } catch (error) {
        throw handleFirestoreError(error, 'projects');
    }
}
export const addProject = (data: Omit<Project, 'id' | 'createdAt'>) => db && addDoc(collection(db, "projects"), { ...data, createdAt: serverTimestamp() });
export const updateProject = (id: string, data: Partial<Project>) => db && updateDoc(doc(db, "projects", id), data);
export const deleteProject = async (id: string) => {
    if (!db) throw new Error("Firestore not initialized");
    const batch = writeBatch(db);
    // Delete project
    batch.delete(doc(db, "projects", id));
    // Find and delete related campaigns, topics, and generations
    const collectionsToDelete = ['campaigns', 'topics', 'generations'];
    for (const coll of collectionsToDelete) {
        const q = query(collection(db, coll), where("projectId", "==", id));
        const snapshot = await getDocs(q);
        snapshot.docs.forEach(d => batch.delete(d.ref));
    }
    await batch.commit();
}

// CAMPAIGNS
export const getCampaigns = async (projectId: string, userId: string): Promise<Campaign[]> => {
    if (!db) return [];
    try {
        const q = query(
            collection(db, "campaigns"), 
            where("projectId", "==", projectId), 
            where("userId", "==", userId), 
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        return typedCollection<Campaign>(snapshot.docs);
    } catch (error) {
        throw handleFirestoreError(error, 'campaigns');
    }
}
export const getAllUserCampaigns = async (userId: string): Promise<Campaign[]> => {
    if (!db) return [];
    try {
        const q = query(collection(db, "campaigns"), where("userId", "==", userId));
        const snapshot = await getDocs(q);
        return typedCollection<Campaign>(snapshot.docs);
    } catch (error) {
        throw handleFirestoreError(error, 'all user campaigns');
    }
}
export const addCampaign = (data: Omit<Campaign, 'id' | 'createdAt'>) => db && addDoc(collection(db, "campaigns"), { ...data, createdAt: serverTimestamp() });
export const updateCampaign = (id: string, data: Partial<Campaign>) => db && updateDoc(doc(db, "campaigns", id), data);
export const deleteCampaign = async (id: string) => {
    if (!db) throw new Error("Firestore not initialized");
    const batch = writeBatch(db);
    batch.delete(doc(db, "campaigns", id));
    const collectionsToDelete = ['topics', 'generations'];
     for (const coll of collectionsToDelete) {
        const q = query(collection(db, coll), where("campaignId", "==", id));
        const snapshot = await getDocs(q);
        snapshot.docs.forEach(d => batch.delete(d.ref));
    }
    await batch.commit();
}

// TOPICS
export const getTopics = async (campaignId: string, userId: string): Promise<Topic[]> => {
    if (!db) return [];
     try {
        const q = query(
            collection(db, "topics"), 
            where("campaignId", "==", campaignId), 
            where("userId", "==", userId), 
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        return typedCollection<Topic>(snapshot.docs);
    } catch (error) {
        throw handleFirestoreError(error, 'topics');
    }
}
export const getAllUserTopics = async (userId: string): Promise<Topic[]> => {
    if (!db) return [];
    try {
        const q = query(collection(db, "topics"), where("userId", "==", userId));
        const snapshot = await getDocs(q);
        return typedCollection<Topic>(snapshot.docs);
    } catch (error) {
        throw handleFirestoreError(error, 'all user topics');
    }
}
export const addTopic = (data: Omit<Topic, 'id' | 'createdAt' | 'status'>) => db && addDoc(collection(db, "topics"), { ...data, status: 'Draft', createdAt: serverTimestamp() });
export const addMultipleTopics = async (topics: { name: string }[], userId: string, projectId: string, campaignId: string) => {
    if (!db) throw new Error("Database not configured.");
    try {
        const batch = writeBatch(db);
        const topicsCollection = collection(db, "topics");

        topics.forEach(topic => {
            const newTopicRef = doc(topicsCollection);
            batch.set(newTopicRef, {
                name: topic.name,
                userId,
                projectId,
                campaignId,
                status: 'Draft',
                createdAt: serverTimestamp()
            });
        });

        await batch.commit();
    } catch (error) {
        throw handleFirestoreError(error, 'adding multiple topics');
    }
};
export const updateTopic = (id: string, data: Partial<Topic>) => db && updateDoc(doc(db, "topics", id), data);
export const deleteTopic = async (id: string) => {
    if (!db) throw new Error("Firestore not initialized");
    const batch = writeBatch(db);
    batch.delete(doc(db, "topics", id));
    const q = query(collection(db, "generations"), where("topicId", "==", id));
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
}

// --- GENERATED CONTENT & IMAGE STORAGE ---

/**
 * Uploads a base64 encoded image to Firebase Storage and returns the download URL.
 * @param base64Image The base64 data URL string (e.g., "data:image/png;base64,...").
 * @param userId The ID of the user uploading the image.
 * @param context IDs for project, campaign, and topic to create a structured path.
 * @param contentId The unique ID for the content document this image belongs to.
 * @returns The public URL of the uploaded image.
 */
const uploadGeneratedImage = async (
    base64Image: string,
    userId: string,
    context: { projectId: string; campaignId: string; topicId: string; },
    contentId: string
): Promise<string> => {
    if (!storage) throw new Error("Firebase Storage is not configured.");

    const path = `generations/${userId}/${context.projectId}/${context.campaignId}/${context.topicId}/${contentId}.png`;
    const storageRef = ref(storage, path);
    
    try {
        // 'uploadString' with 'data_url' handles the base64 string correctly.
        const snapshot = await uploadString(storageRef, base64Image, 'data_url');
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading image to Firebase Storage:", error);
        throw new Error("Failed to upload the generated image.");
    }
};


export const saveGeneratedContent = async (
    userId: string, 
    topic: string, 
    language: string, 
    content: GeneratedContent,
    context: { projectId: string; campaignId: string; topicId: string; }
) => {
    if (!db) throw new Error("Could not save content: Firestore not configured.");

    try {
        // Create a reference for the new document to get its ID beforehand.
        const newContentRef = doc(collection(db, "generations"));
        const contentId = newContentRef.id;

        // Check if a new image was generated (it will be a base64 string)
        if (content.image.url && content.image.url.startsWith('data:image/')) {
            // Upload the new image to Firebase Storage
            const permanentImageUrl = await uploadGeneratedImage(content.image.url, userId, context, contentId);
            // Replace the temporary base64 URL with the permanent Storage URL
            content.image.url = permanentImageUrl;
        }

        const contentData = Object.assign({}, content, context, {
            userId,
            topic,
            language,
            createdAt: serverTimestamp()
        });

        // Save the complete content document to Firestore with the new ID.
        await setDoc(newContentRef, contentData);

        // Update topic status and link contentId
        await updateDoc(doc(db, "topics", context.topicId), {
            status: 'Generated',
            contentId: contentId
        });
        return contentId;

    } catch (error) {
        console.error("Error writing document to Firestore or uploading to Storage: ", error);
        throw new Error("Could not save content.");
    }
};

export const getContentById = async (contentId: string): Promise<SavedContent | null> => {
    if (!db) return null;
    const docRef = doc(db, "generations", contentId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        // FIX: Use Object.assign to avoid "Spread types may only be created from object types" error.
        return Object.assign({ id: docSnap.id }, docSnap.data()) as SavedContent;
    }
    return null;
}

export const getUserContent = async (userId: string): Promise<SavedContent[]> => {
    if (!db) return [];
    try {
        const q = query(collection(db, "generations"), where("userId", "==", userId), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        // FIX: Use Object.assign to avoid "Spread types may only be created from object types" error.
        return querySnapshot.docs.map(doc => (
            Object.assign({ id: doc.id }, doc.data()) as SavedContent
        ));
    } catch (error) {
        throw handleFirestoreError(error, "user content");
    }
};

// BRAND VOICE PROFILES
export const getBrandVoiceProfiles = async (userId: string): Promise<BrandVoiceProfile[]> => {
    if (!db) return [];
    try {
        const q = query(collection(db, "brandVoiceProfiles"), where("userId", "==", userId), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return typedCollection<BrandVoiceProfile>(snapshot.docs);
    } catch (error) {
        throw handleFirestoreError(error, 'brand voice profiles');
    }
};

export const addBrandVoiceProfile = async (data: Omit<BrandVoiceProfile, 'id' | 'createdAt'>) => {
    if (!db) throw new Error("Database not configured.");
    try {
        await addDoc(collection(db, "brandVoiceProfiles"), { ...data, createdAt: serverTimestamp() });
    } catch (error) {
        throw handleFirestoreError(error, 'adding brand voice profile');
    }
};

export const updateBrandVoiceProfile = async (id: string, data: Partial<BrandVoiceProfile>) => {
    if (!db) throw new Error("Database not configured.");
    try {
        await updateDoc(doc(db, "brandVoiceProfiles", id), data);
    } catch (error) {
        throw handleFirestoreError(error, 'updating brand voice profile');
    }
};

export const deleteBrandVoiceProfile = async (id: string) => {
    if (!db) throw new Error("Database not configured.");
    try {
        await deleteDoc(doc(db, "brandVoiceProfiles", id));
    } catch (error) {
        throw handleFirestoreError(error, 'deleting brand voice profile');
    }
};

// --- ACCOUNT SETTINGS ---
export const updateUserDisplayName = async (displayName: string) => {
    if (!auth?.currentUser) throw new Error("User not authenticated.");
    try {
        await updateProfile(auth.currentUser, { displayName });
    } catch (error) {
        throw new Error(getFirebaseAuthErrorMessage(error as FirebaseError));
    }
};

export const sendPasswordReset = async () => {
    if (!auth?.currentUser?.email) throw new Error("User not authenticated or has no email.");
    try {
        await sendPasswordResetEmail(auth, auth.currentUser.email);
    } catch (error) {
        throw new Error(getFirebaseAuthErrorMessage(error as FirebaseError));
    }
};

export const deleteUserAccount = async (userId: string) => {
    if (!auth?.currentUser || auth.currentUser.uid !== userId || !db) {
        throw new Error("Authentication error or database not configured.");
    }
    
    const batch = writeBatch(db);
    const collectionsToDelete = ['projects', 'campaigns', 'topics', 'generations', 'brandVoiceProfiles'];
    
    try {
        // Batch delete all user data from Firestore
        for (const coll of collectionsToDelete) {
            const q = query(collection(db, coll), where("userId", "==", userId));
            const snapshot = await getDocs(q);
            snapshot.docs.forEach(d => batch.delete(d.ref));
        }
        await batch.commit();

        // After successfully deleting data, delete the auth user
        await deleteUser(auth.currentUser);
    } catch (error) {
        console.error("Error deleting user account:", error);
        if ((error as FirebaseError).code === 'auth/requires-recent-login') {
            throw new Error("This is a sensitive operation and requires you to have recently signed in. Please sign out and sign back in to delete your account.");
        }
        throw new Error("Failed to delete account and all associated data.");
    }
};

export type { User };