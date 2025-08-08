
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export interface Snack {
    id: string;
    type: 'parippuvada' | 'vazhaikkapam';
    area: number;
    createdAt: Date;
}

export async function saveSnack(snack: Omit<Snack, 'id'>): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, "snacks"), {
            ...snack,
            createdAt: new Date()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding document: ", error);
        throw new Error("Could not save snack to the database.");
    }
}

export async function getLargestSnack(type: 'parippuvada' | 'vazhaikkapam'): Promise<Snack | null> {
    try {
        const snacksCollection = collection(db, "snacks");
        const q = query(
            snacksCollection,
            where("type", "==", type),
            orderBy("area", "desc"),
            limit(1)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const doc = querySnapshot.docs[0];
        const data = doc.data();

        return {
            id: doc.id,
            type: data.type,
            area: data.area,
            createdAt: data.createdAt.toDate(),
        };

    } catch (error) {
        console.error("Error getting largest snack: ", error);
        // It's better to return null and not block the user flow if the database read fails.
        // The commentary will just act as if it's the first snack.
        return null;
    }
}
