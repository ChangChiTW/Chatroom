import firebaseConfig from "./config/firebaseConfig";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getMessaging } from "firebase/messaging";
import { getToken } from "firebase/messaging";

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);
const db = getDatabase(firebaseApp);
const messaging = getMessaging(firebaseApp);

Notification.requestPermission();

let token;
getToken(messaging, {
  vapidKey: "BL7OrrhvkRUoxTaWjYpFYspWGqJUCtz0h3rh0PzgG96bDShO4XavSV1mBXYO7Rl6qYP6fTOTZHcvN9NEs_xRaac",
})
  .then(currentToken => {
    if (currentToken) {
      token = currentToken;
      console.log(token);
    } else {
      console.log("No registration token available. Request permission to generate one.");
    }
  })
  .catch(err => {
    console.log("An error occurred while retrieving token. ", err);
  });

export { auth, db, messaging, token };
