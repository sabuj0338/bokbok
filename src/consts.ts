export const MEDIA_CONSTRAINTS = {
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
  audio: true,
};

export const ICE_SERVERS = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

export const BIT_RATES = [
  {
    rid: "high",
    maxBitrate: 2500000,
  }, // High quality
  {
    rid: "mid",
    maxBitrate: 1000000,
  }, // Medium quality
  {
    rid: "low",
    maxBitrate: 300000,
  }, // Low quality
];
