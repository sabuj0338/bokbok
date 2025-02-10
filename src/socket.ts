import { io } from "socket.io-client";

// "undefined" means the URL will be computed from the `window.location` object
const prodSocketURL = "https://bokbok.onrender.com";
// const devSocketURL = "http://192.168.0.100:3000";
// const URL = devSocketURL;
// const URL = import.meta.env.NODE_ENV === "production" ? prodSocketURL : devSocketURL;

export const socket = io(prodSocketURL);
