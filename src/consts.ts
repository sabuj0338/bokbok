export const media_constraints = {
  video: {
    width: {
      ideal: 1280,
    },
    height: {
      ideal: 720,
    },
    frameRate: {
      max: 30,
    },
  },
  audio: false,
};

export const ice_servers = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};
