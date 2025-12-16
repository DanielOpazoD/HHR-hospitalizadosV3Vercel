/**
 * Firestore Session Store for WhatsApp Web.js RemoteAuth
 * Saves WhatsApp session data to Firestore so it persists across deploys
 */

import * as admin from 'firebase-admin';

interface SessionData {
    session: string;
    lastUpdated: string;
}

export class FirestoreStore {
    private db: admin.firestore.Firestore;
    private collection: string;

    constructor(collectionName: string = 'whatsapp-sessions') {
        this.db = admin.firestore();
        this.collection = collectionName;
    }

    async sessionExists(options: { session: string }): Promise<boolean> {
        try {
            const doc = await this.db.collection(this.collection).doc(options.session).get();
            return doc.exists;
        } catch (error) {
            console.error('❌ Error checking session:', error);
            return false;
        }
    }

    async save(options: { session: string }): Promise<void> {
        // This is called but we handle saves in extract
        console.log('📦 Session save called for:', options.session);
    }

    async extract(options: { session: string; path?: string }): Promise<string | null> {
        try {
            const doc = await this.db.collection(this.collection).doc(options.session).get();
            if (!doc.exists) {
                console.log('📦 No session found in Firestore');
                return null;
            }
            const data = doc.data() as SessionData;
            console.log('✅ Session loaded from Firestore');
            return data.session;
        } catch (error) {
            console.error('❌ Error extracting session:', error);
            return null;
        }
    }

    async store(options: { session: string }, data: string): Promise<void> {
        try {
            await this.db.collection(this.collection).doc(options.session).set({
                session: data,
                lastUpdated: new Date().toISOString()
            });
            console.log('💾 Session saved to Firestore');
        } catch (error) {
            console.error('❌ Error storing session:', error);
        }
    }

    async delete(options: { session: string }): Promise<void> {
        try {
            await this.db.collection(this.collection).doc(options.session).delete();
            console.log('🗑️ Session deleted from Firestore');
        } catch (error) {
            console.error('❌ Error deleting session:', error);
        }
    }
}
