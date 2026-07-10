import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// We don't have access to the config directly from Node without reading it. Let's just create a component that does it.
