import { useEffect, useRef, useState, useCallback } from "react";
import { API_URL } from "../api.js";

const getIceServers = () => {
  const envIce = import.meta.env.VITE_ICE_SERVERS;
  if (envIce) {
    try {
      const parsed = typeof envIce === "string" ? JSON.parse(envIce) : envIce;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { iceServers: parsed };
      }
    } catch (e) {
      console.warn("Failed to parse VITE_ICE_SERVERS. Using fallback STUN.", e);
    }
  }
  return {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };
};

const ICE_SERVERS = getIceServers();

const VIDEO_CONSTRAINTS = {
  width: { ideal: 640, max: 1280 },
  height: { ideal: 360, max: 720 },
  frameRate: { ideal: 24, max: 30 },
};

const AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

export function useMeetingRoom(code, token, userName) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [remoteMediaStates, setRemoteMediaStates] = useState({});
  const [participants, setParticipants] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [meetingEnded, setMeetingEnded] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [mediaWarning, setMediaWarning] = useState(null);

  // Zoom-style Interactive Features
  const [reactions, setReactions] = useState([]);
  const [raisedHands, setRaisedHands] = useState({});
  const [handRaised, setHandRaised] = useState(false);
  const [facingMode, setFacingMode] = useState("user");
  const [reconnecting, setReconnecting] = useState(false);

  const pcMap = useRef({});
  const iceCandidatesQueue = useRef({});
  const ws = useRef(null);
  const localStreamRef = useRef(null);
  const screenTrackRef = useRef(null);
  const screenSharingRef = useRef(false);
  const meetingEndedRef = useRef(false);

  const sendSignal = useCallback((data) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  }, []);

  const processQueuedCandidates = useCallback(async (remoteId, pc) => {
    const queue = iceCandidatesQueue.current[remoteId] || [];
    while (queue.length > 0) {
      const candidate = queue.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("Failed to add queued ICE candidate:", err);
      }
    }
  }, []);

  const createPeerConnection = useCallback((remoteId, isInitiator) => {
    if (pcMap.current[remoteId]) return pcMap.current[remoteId];

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcMap.current[remoteId] = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          pc.addTrack(track, localStreamRef.current);
        } catch (e) {
          console.warn("Failed to add track:", e);
        }
      });
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendSignal({ type: "ice-candidate", to: remoteId, payload: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      if (e.streams && e.streams[0]) {
        setRemoteStreams((prev) => ({
          ...prev,
          [remoteId]: e.streams[0],
        }));
      }
    };

    const startNegotiation = async () => {
      try {
        if (pc.signalingState === "closed") return;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal({ type: "offer", to: remoteId, payload: offer });
      } catch (err) {
        console.error("Offer error:", err);
      }
    };

    if (isInitiator) {
      pc.onnegotiationneeded = startNegotiation;
      // Also initiate immediately to guarantee offer is dispatched
      startNegotiation();
    }

    return pc;
  }, [sendSignal]);

  const handleSignalMessage = useCallback(async (msg) => {
    const { type, from: senderId, payload } = msg;

    switch (type) {
      case "room-info":
      case "participants": {
        const roster = Array.isArray(payload) ? payload : msg.participants || [];
        setParticipants(roster);
        break;
      }
      case "join": {
        if (senderId) {
          setParticipants((prev) => {
            if (prev.some((p) => p.user_id === senderId)) return prev;
            return [...prev, { user_id: senderId, name: payload?.name || "Participant" }];
          });
          createPeerConnection(senderId, true);
        }
        break;
      }
      case "offer": {
        if (!senderId || !payload) return;
        const pc = createPeerConnection(senderId, false);
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload));
          await processQueuedCandidates(senderId, pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal({ type: "answer", to: senderId, payload: answer });
        } catch (err) {
          console.error("Error handling offer:", err);
        }
        break;
      }
      case "answer": {
        if (!senderId || !payload) return;
        const pc = pcMap.current[senderId];
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload));
            await processQueuedCandidates(senderId, pc);
          } catch (err) {
            console.error("Error handling answer:", err);
          }
        }
        break;
      }
      case "ice-candidate": {
        if (!senderId || !payload) return;
        const pc = pcMap.current[senderId];
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(payload));
          } catch (err) {
            console.warn("addIceCandidate error:", err);
          }
        } else {
          iceCandidatesQueue.current[senderId] = iceCandidatesQueue.current[senderId] || [];
          iceCandidatesQueue.current[senderId].push(payload);
        }
        break;
      }
      case "media-state": {
        if (senderId && payload) {
          setRemoteMediaStates((prev) => ({
            ...prev,
            [senderId]: { ...prev[senderId], ...payload },
          }));
        }
        break;
      }
      case "chat": {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: payload?.name || "Participant",
            text: payload?.text || "",
            senderId,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        break;
      }
      case "reaction": {
        if (payload?.emoji) {
          const id = Math.random().toString(36).substring(2, 9);
          setReactions((prev) => [
            ...prev,
            { id, emoji: payload.emoji, name: payload.name || "Participant" },
          ]);
          setTimeout(() => {
            setReactions((prev) => prev.filter((r) => r.id !== id));
          }, 4000);
        }
        break;
      }
      case "raise-hand": {
        if (senderId) {
          setRaisedHands((prev) => ({
            ...prev,
            [senderId]: payload?.raised ?? true,
          }));
        }
        break;
      }
      case "meeting-ended": {
        meetingEndedRef.current = true;
        setMeetingEnded(true);
        break;
      }
      case "leave": {
        if (pcMap.current[senderId]) {
          try {
            pcMap.current[senderId].close();
          } catch {}
          delete pcMap.current[senderId];
        }
        delete iceCandidatesQueue.current[senderId];
        setRemoteStreams((prev) => {
          const next = { ...prev };
          delete next[senderId];
          return next;
        });
        setRemoteMediaStates((prev) => {
          const next = { ...prev };
          delete next[senderId];
          return next;
        });
        setRaisedHands((prev) => {
          const next = { ...prev };
          delete next[senderId];
          return next;
        });
        setParticipants((prev) => prev.filter((p) => p.user_id !== senderId));
        break;
      }
      default:
        break;
    }
  }, [createPeerConnection, processQueuedCandidates, sendSignal]);

  const stopScreenShare = useCallback(() => {
    if (screenTrackRef.current) {
      try {
        screenTrackRef.current.stop();
      } catch (e) {
        console.warn("Failed to stop screen track:", e);
      }
      screenTrackRef.current = null;
    }
    screenSharingRef.current = false;
    setScreenSharing(false);

    if (localStreamRef.current) {
      const camTrack = localStreamRef.current.getVideoTracks()[0];
      if (camTrack) {
        Object.values(pcMap.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
          if (sender) {
            sender.replaceTrack(camTrack).catch((err) => console.warn("Reverting track failed:", err));
          }
        });
      }
      sendSignal({
        type: "media-state",
        payload: { camOn: camOn, screenSharing: false },
      });
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
    }
  }, [camOn, sendSignal]);

  useEffect(() => {
    if (!code || !token) return;

    let mounted = true;

    async function init() {
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: VIDEO_CONSTRAINTS,
          audio: AUDIO_CONSTRAINTS,
        });
      } catch (videoErr) {
        console.warn("Could not get audio+video, trying audio only:", videoErr);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: AUDIO_CONSTRAINTS,
          });
          if (mounted) {
            setCamOn(false);
            setMediaWarning("Camera unavailable. Joined with microphone only.");
          }
        } catch (audioErr) {
          console.warn("Audio also unavailable, joining in listen-only mode:", audioErr);
          stream = new MediaStream();
          if (mounted) {
            setCamOn(false);
            setMicOn(false);
            setMediaWarning("Camera and microphone unavailable. Joined in listen mode.");
          }
        }
      }

      if (!mounted) {
        if (stream) {
          stream.getTracks().forEach((t) => t.stop());
        }
        return;
      }

      localStreamRef.current = stream;
      setLocalStream(stream);

      const wsProtocol = API_URL.startsWith("https") ? "wss:" : "ws:";
      const apiHost = API_URL.replace(/^https?:\/\//, "");
      const wsUrl = `${wsProtocol}//${apiHost}/ws/meeting/${code}?token=${encodeURIComponent(token)}`;

      try {
        const socket = new WebSocket(wsUrl);
        ws.current = socket;

        socket.onopen = () => {
          if (mounted) setConnectionError(null);
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleSignalMessage(data);
          } catch (e) {
            console.error("Failed to parse signal message:", e);
          }
        };

        socket.onerror = () => {
          if (mounted) setConnectionError("WebSocket connection failed");
        };

        socket.onclose = () => {};
      } catch (err) {
        if (mounted) setConnectionError("Failed to initialize WebSocket");
      }
    }

    init();

    return () => {
      mounted = false;
      if (ws.current) {
        try {
          ws.current.close();
        } catch {}
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {}
        });
      }
      if (screenTrackRef.current) {
        try {
          screenTrackRef.current.stop();
        } catch {}
      }
      Object.values(pcMap.current).forEach((pc) => {
        try {
          pc.close();
        } catch {}
      });
      pcMap.current = {};
      iceCandidatesQueue.current = {};
    };
  }, [code, token, handleSignalMessage]);

  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        const nextState = !audioTrack.enabled;
        audioTrack.enabled = nextState;
        setMicOn(nextState);
        sendSignal({ type: "media-state", payload: { micOn: nextState } });
      }
    }
  }, [sendSignal]);

  const toggleCam = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        const nextState = !videoTrack.enabled;
        videoTrack.enabled = nextState;
        setCamOn(nextState);
        sendSignal({ type: "media-state", payload: { camOn: nextState } });
      }
    }
  }, [sendSignal]);


  const toggleScreenShare = useCallback(async () => {
    if (screenSharingRef.current) {
      stopScreenShare();
    } else {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          alert("Screen sharing is not supported in this browser.");
          return;
        }
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        if (!screenTrack) return;

        screenTrackRef.current = screenTrack;
        screenSharingRef.current = true;
        setScreenSharing(true);

        screenTrack.onended = () => {
          stopScreenShare();
        };

        Object.values(pcMap.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
          if (sender) sender.replaceTrack(screenTrack).catch(() => {});
        });

        sendSignal({
          type: "media-state",
          payload: { camOn: true, screenSharing: true },
        });

        if (localStreamRef.current) {
          const audioTracks = localStreamRef.current.getAudioTracks();
          setLocalStream(new MediaStream([screenTrack, ...audioTracks]));
        }
      } catch (err) {
        if (err.name !== "NotAllowedError") {
          console.error("Screen sharing failed:", err);
        }
        screenSharingRef.current = false;
        setScreenSharing(false);
      }
    }
  }, [stopScreenShare, sendSignal]);

  const sendChat = useCallback((text) => {
    if (!text || !text.trim()) return;
    const trimmed = text.trim();
    sendSignal({ type: "chat", payload: { text: trimmed } });
    const payload = {
      sender: userName || "You",
      text: trimmed,
      senderId: "local",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setChatMessages((prev) => [...prev, payload]);
  }, [userName, sendSignal]);

  const leaveMeeting = useCallback(() => {
    if (ws.current) {
      try {
        ws.current.close();
      } catch {}
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {}
      });
    }
    if (screenTrackRef.current) {
      try {
        screenTrackRef.current.stop();
      } catch {}
    }
    Object.values(pcMap.current).forEach((pc) => {
      try {
        pc.close();
      } catch {}
    });
    pcMap.current = {};
    iceCandidatesQueue.current = {};
  }, []);

  const sendReaction = useCallback((emoji) => {
    sendSignal({ type: "reaction", payload: { emoji, name: userName || "You" } });
    const id = Math.random().toString(36).substring(2, 9);
    setReactions((prev) => [...prev, { id, emoji, name: userName || "You" }]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 4000);
  }, [userName, sendSignal]);

  const toggleRaiseHand = useCallback(() => {
    setHandRaised((prev) => {
      const next = !prev;
      sendSignal({ type: "raise-hand", payload: { raised: next, name: userName || "You" } });
      return next;
    });
  }, [userName, sendSignal]);

  const flipCamera = useCallback(async () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { ...VIDEO_CONSTRAINTS, facingMode: nextMode },
        audio: false,
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      if (localStreamRef.current) {
        const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
        if (oldVideoTrack) {
          oldVideoTrack.stop();
          localStreamRef.current.removeTrack(oldVideoTrack);
        }
        localStreamRef.current.addTrack(newVideoTrack);
      }
      Object.values(pcMap.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender) sender.replaceTrack(newVideoTrack).catch(() => {});
      });
      setFacingMode(nextMode);
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
    } catch (e) {
      console.warn("Could not flip camera:", e);
    }
  }, [facingMode]);

  return {
    localStream,
    remoteStreams,
    remoteMediaStates,
    participants,
    chatMessages,
    camOn,
    micOn,
    screenSharing,
    meetingEnded,
    connectionError,
    mediaWarning,
    reactions,
    raisedHands,
    handRaised,
    reconnecting,
    facingMode,
    toggleMic,
    toggleCam,
    toggleScreenShare,
    stopScreenShare,
    sendChat,
    sendReaction,
    toggleRaiseHand,
    flipCamera,
    leaveMeeting,
  };
}
