import { io } from "socket.io-client";

// "undefined" means the URL will be computed from the `window.location` object
const productionSocketURL = "https://bokbok.onrender.com";
const URL = import.meta.env.NODE_ENV === "production" ? productionSocketURL : productionSocketURL;

export const socket = io(URL);
