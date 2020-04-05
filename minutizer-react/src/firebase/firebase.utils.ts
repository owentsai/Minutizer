import firebase from "firebase/app";
import "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCG-VbQWybOcqozck_lbl22IZZ9cIUXLb4",
  authDomain: "hacksbc-268409.firebaseapp.com",
  databaseURL: "https://hacksbc-268409.firebaseio.com",
  projectId: "hacksbc-268409",
  storageBucket: "hacksbc-268409.appspot.com",
  messagingSenderId: "304293676416",
  appId: "1:304293676416:web:19fbbe02659bf7b8c56d65"
};

firebase.initializeApp(firebaseConfig);

export const auth = firebase.auth();
export default firebase;
