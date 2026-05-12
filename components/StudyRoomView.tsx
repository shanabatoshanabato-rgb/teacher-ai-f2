import React, { useState, useEffect, useRef } from 'react';
import {
  Video, Mic, MicOff, VideoOff, ScreenShare, LogOut,
  Copy, Check, Users, Shield, Trash2, VolumeX, Loader2, Camera, Monitor, Settings
} from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot,
  collection, addDoc, deleteDoc
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isSharing?: boolean;
  status?: string;
  forceMute?: number;
}

// Separate connections for camera and screen share
interface PeerConnections {
  camera: RTCPeerConnection | null;
  screen: RTCPeerConnection | null;
}

const StudyRoomView: React.FC = () => {
  const isAr = document.documentElement.lang === 'ar';

  // State
  const [mode, setMode] = useState<'lobby' | 'room'>('lobby');
  const [userName, setUserName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [userId] = useState(() => { const arr = new Uint8Array(8); crypto.getRandomValues(arr); return Array.from(arr, b => b.toString(36)).join('').substring(0, 9); });
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [remoteScreenStreams, setRemoteScreenStreams] = useState<Record<string, MediaStream>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Refs for WebRTC
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  // Separate PC for camera and screen per user
  const pcsRef = useRef<Record<string, PeerConnections>>({});
  const roomRef = useRef<any>(null);

  const tx = (ar: string, en: string) => isAr ? ar : en;

  // Cleanup on unmount
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = AR_STYLE;
    document.head.appendChild(style);

    return () => {
      leaveRoom();
      document.head.removeChild(style);
    };
  }, []);

  // Auto-join if URL params are present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const name = params.get('name');
    const host = params.get('host') === 'true';

    if (code && name) {
      setUserName(name);
      setRoomCode(code);
      setIsHost(host);
      startRoom(code, host);
    }
  }, []);

  // Sync local video when layout changes
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [participants.find(p => p.isSharing)?.id, mode]);

  const setupLocalMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error("Error accessing media devices:", err);
      try {
        return await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        return null;
      }
    }
  };

  const createRoom = async () => {
    if (!userName) return alert(tx('يرجى إدخال اسمك', 'Please enter your name'));
    setIsLoading(true);

    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const arr = new Uint8Array(6);
    crypto.getRandomValues(arr);
    const code = Array.from(arr, b => chars[b % chars.length]).join('');
    const roomDoc = doc(db, 'rooms', code);

    await setDoc(roomDoc, {
      hostId: userId,
      hostName: userName,
      status: 'active',
      createdAt: Date.now()
    });

    setIsLoading(false);
    window.open(`${window.location.origin}${window.location.pathname}?code=${code}&name=${userName}&host=true`, '_blank');
  };

  const joinRoom = async () => {
    if (!userName || !roomCode) return alert(tx('يرجى إدخال الاسم ورمز الغرفة', 'Please enter name and room code'));
    setIsLoading(true);

    const code = roomCode.toUpperCase();
    const roomDoc = doc(db, 'rooms', code);
    const snap = await getDoc(roomDoc);

    if (!snap.exists() || snap.data().status === 'ended') {
      setIsLoading(false);
      return alert(tx('الغرفة غير موجودة أو انتهت', 'Room not found or ended'));
    }

    setIsLoading(false);
    window.open(`${window.location.origin}${window.location.pathname}?code=${code}&name=${userName}&host=false`, '_blank');
  };

  const startRoom = async (code: string, host: boolean) => {
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      setIsLoading(false);
      return alert(tx('يجب استخدام HTTPS للوصول إلى الكاميرا والشاشة', 'HTTPS is required to access Camera and Screen Sharing'));
    }

    const stream = await setupLocalMedia();
    if (!stream) {
      setIsLoading(false);
      return alert(tx('تعذر الوصول إلى الكاميرا أو الميكروفون', 'Could not access camera or microphone'));
    }

    const roomDoc = doc(db, 'rooms', code);
    roomRef.current = roomDoc;

    const selfDoc = doc(collection(roomDoc, 'participants'), userId);
    await setDoc(selfDoc, {
      name: userName,
      isHost: host,
      joinedAt: Date.now(),
      isMuted: false,
      isVideoOff: false,
      isSharing: false
    });

    setMode('room');
    setIsLoading(false);

    onSnapshot(collection(roomDoc, 'participants'), (snapshot) => {
      const parts: Participant[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (doc.id === userId) {
          if (data.status === 'removed') {
            alert(tx('تمت إزالتك من الغرفة', 'You have been removed from the room'));
            leaveRoom();
            return;
          }
          if (data.forceMute && !isMuted) {
            localStreamRef.current?.getAudioTracks().forEach(track => track.enabled = false);
            setIsMuted(true);
          }
        }
        parts.push({ id: doc.id, ...data } as Participant);
      });
      setParticipants(parts);
    });

    onSnapshot(roomDoc, (snapshot) => {
      if (snapshot.exists() && snapshot.data().status === 'ended') {
        alert(tx('انتهت الجلسة من قبل المضيف', 'The session has been ended by the host'));
        leaveRoom();
      }
    });

    setupMeshConnections(code);
  };

  const setupMeshConnections = (code: string) => {
    const roomDoc = doc(db, 'rooms', code);
    const participantsCol = collection(roomDoc, 'participants');

    onSnapshot(participantsCol, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const otherUserId = change.doc.id;
        if (otherUserId === userId) return;

        if (change.type === 'added') {
          // Mesh initiation logic
          if (userId > otherUserId) {
            initiateConnection(otherUserId, 'camera');
          }
        }
        if (change.type === 'removed') {
          if (pcsRef.current[otherUserId]) {
            pcsRef.current[otherUserId].camera?.close();
            pcsRef.current[otherUserId].screen?.close();
            delete pcsRef.current[otherUserId];
          }
          setRemoteStreams(prev => {
            const next = { ...prev };
            delete next[otherUserId];
            return next;
          });
          setRemoteScreenStreams(prev => {
            const next = { ...prev };
            delete next[otherUserId];
            return next;
          });
        }
      });
    });

    const callsCol = collection(roomDoc, 'calls');
    onSnapshot(callsCol, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const data = change.doc.data();
        if (data.to !== userId) return;

        const from = data.from;
        const connType = (data.connType as 'camera' | 'screen') || 'camera';

        if (change.type === 'added' || change.type === 'modified') {
          if (data.offer) {
            handleOffer(from, data.offer, connType);
          } else if (data.answer) {
            handleAnswer(from, data.answer, connType);
          } else if (data.candidate) {
            handleCandidate(from, data.candidate, connType);
          }
        }
      });
    });
  };

  const createPC = (otherId: string, connType: 'camera' | 'screen') => {
    const pc = new RTCPeerConnection(servers);

    if (!pcsRef.current[otherId]) {
      pcsRef.current[otherId] = { camera: null, screen: null };
    }
    pcsRef.current[otherId][connType] = pc;

    if (connType === 'camera') {
      localStreamRef.current?.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    } else if (connType === 'screen' && screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, screenStreamRef.current!);
      });
    }

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (connType === 'screen') {
        setRemoteScreenStreams(prev => ({ ...prev, [otherId]: stream }));
      } else {
        setRemoteStreams(prev => ({ ...prev, [otherId]: stream }));
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(collection(roomRef.current, 'calls'), {
          from: userId,
          to: otherId,
          connType: connType,
          candidate: event.candidate.toJSON(),
          timestamp: Date.now()
        });
      }
    };

    return pc;
  };

  const initiateConnection = async (otherId: string, connType: 'camera' | 'screen') => {
    const pc = createPC(otherId, connType);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await addDoc(collection(roomRef.current, 'calls'), {
      from: userId,
      to: otherId,
      connType: connType,
      offer: { type: offer.type, sdp: offer.sdp },
      timestamp: Date.now()
    });
  };

  const handleOffer = async (fromId: string, offer: any, connType: 'camera' | 'screen') => {
    const pc = createPC(fromId, connType);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await addDoc(collection(roomRef.current, 'calls'), {
      from: userId,
      to: fromId,
      connType: connType,
      answer: { type: answer.type, sdp: answer.sdp },
      timestamp: Date.now()
    });
  };

  const handleAnswer = async (fromId: string, answer: any, connType: 'camera' | 'screen') => {
    const pc = pcsRef.current[fromId]?.[connType];
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  const handleCandidate = async (fromId: string, candidate: any, connType: 'camera' | 'screen') => {
    const pc = pcsRef.current[fromId]?.[connType];
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const toggleMic = () => {
    const newMuted = !isMuted;
    localStreamRef.current?.getAudioTracks().forEach(track => {
      track.enabled = !newMuted;
    });
    setIsMuted(newMuted);
    if (roomRef.current) {
      updateDoc(doc(roomRef.current, 'participants', userId), {
        isMuted: newMuted,
        forceMute: null
      });
    }
  };

  const toggleCamera = () => {
    const newVideoOff = !isVideoOff;
    localStreamRef.current?.getVideoTracks().forEach(track => {
      track.enabled = !newVideoOff;
    });
    setIsVideoOff(newVideoOff);
    if (roomRef.current) {
      updateDoc(doc(roomRef.current, 'participants', userId), { isVideoOff: newVideoOff });
    }
  };

  const shareScreen = async () => {
    if (isSharing) { stopScreenShare(); return; }
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screenStream;

      // Initiate screen connections to all participants
      participants.forEach(p => {
        if (p.id !== userId) {
          initiateConnection(p.id, 'screen');
        }
      });

      const screenTrack = screenStream.getVideoTracks()[0];
      screenTrack.onended = stopScreenShare;
      setIsSharing(true);
      updateDoc(doc(roomRef.current, 'participants', userId), { isSharing: true });
    } catch (err) {
      console.error(err);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      Object.keys(pcsRef.current).forEach(otherId => {
        const screenPC = pcsRef.current[otherId]?.screen;
        if (screenPC) {
          screenPC.close();
          pcsRef.current[otherId].screen = null;
        }
      });
      screenStreamRef.current = null;
    }
    setIsSharing(false);
    if (roomRef.current) updateDoc(doc(roomRef.current, 'participants', userId), { isSharing: false });
  };

  const leaveRoom = async () => {
    if (isHost && roomRef.current) {
      await updateDoc(roomRef.current, { status: 'ended' });
    }
    if (roomRef.current && userId) {
      await deleteDoc(doc(roomRef.current, 'participants', userId));
    }
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    Object.values(pcsRef.current).forEach(conns => {
      conns.camera?.close();
      conns.screen?.close();
    });
    pcsRef.current = {};
    setMode('lobby');
    setParticipants([]);
    setRemoteStreams({});
    setRemoteScreenStreams({});
    setIsSharing(false);
  };

  const removeParticipant = async (pId: string) => {
    if (!isHost) return;
    await updateDoc(doc(roomRef.current, 'participants', pId), { status: 'removed' });
  };

  const muteAll = async () => {
    if (!isHost) return;
    participants.forEach(p => {
      if (p.id !== userId) {
        updateDoc(doc(roomRef.current, 'participants', p.id), { forceMute: Date.now() });
      }
    });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (mode === 'lobby') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-12 animate-in fade-in duration-700">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-600/20 rotate-12">
            <Users className="w-12 h-12 text-white -rotate-12" />
          </div>
          <h1 className="text-5xl font-black text-white uppercase tracking-tighter">
            {tx('غرفة الدراسة', 'Study Room')}
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">
            {tx('تواصل مع أصدقائك بالصوت والصورة في بيئة تعليمية متطورة', 'Connect with friends via video and audio in an advanced environment')}
          </p>
        </div>

        <div className="w-full max-w-md space-y-8 bg-white/5 border border-white/10 p-10 rounded-[3rem] backdrop-blur-2xl shadow-2xl">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-2">{tx('اسم العرض', 'Display Name')}</label>
              <input
                type="text"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                placeholder={tx('أدخل اسمك...', 'Enter your name...')}
                className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-white font-black placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all text-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={createRoom}
                disabled={isLoading}
                className="h-20 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl flex flex-col items-center justify-center gap-1 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 group"
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-white/50" /> : (
                  <>
                    <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] uppercase tracking-widest">{tx('إنشاء غرفة', 'Create Room')}</span>
                  </>
                )}
              </button>

              <button
                onClick={joinRoom}
                className="h-20 bg-white/5 border border-white/10 hover:border-white/20 text-white font-black rounded-2xl flex flex-col items-center justify-center gap-1 transition-all group"
              >
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                <span className="text-[10px] uppercase tracking-widest">{tx('انضمام برمز', 'Join with Code')}</span>
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
              <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.4em] text-slate-600"><span className="bg-[#050505] px-4">OR JOIN EXISTING</span></div>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                placeholder={tx('أدخل رمز الغرفة...', 'Enter Room Code...')}
                className="w-full h-16 bg-white/10 border border-white/10 rounded-2xl px-6 text-white font-black placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50 transition-all tracking-[0.3em] text-center text-xl uppercase"
              />
              <button
                onClick={joinRoom}
                disabled={isLoading || !roomCode}
                className="w-full h-16 bg-white text-black hover:bg-slate-200 font-black rounded-2xl transition-all uppercase tracking-widest text-xs disabled:opacity-30"
              >
                {tx('انضم الآن', 'Join Now')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen min-h-0 bg-[#030303] relative overflow-hidden animate-in zoom-in-95 duration-500">
      <div className="absolute top-6 left-6 z-20 flex items-center gap-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">{roomCode}</span>
            <button onClick={copyCode} className="p-1 hover:text-indigo-400 transition-colors">
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-black text-white">{participants.length}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 pb-32 overflow-hidden flex flex-col">
        {participants.find(p => p.isSharing) ? (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <div className="flex-1 bg-[#0a0a0c] rounded-[2.5rem] border border-white/10 overflow-hidden relative shadow-2xl">
              {participants.map(p => p.isSharing && (
                <div key={p.id} className="w-full h-full bg-black flex items-center justify-center">
                  <RemoteVideo
                    stream={p.id === userId ? screenStreamRef.current! : remoteScreenStreams[p.id]}
                    isVideoOff={false}
                    muted={true}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-4 left-4 flex items-center gap-3 bg-emerald-600/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">
                      {p.name} {tx('يشارك الشاشة الآن', 'is sharing screen')}
                    </span>
                    {p.id !== userId && <VoiceIndicator stream={remoteStreams[p.id]} />}
                  </div>
                </div>
              ))}
            </div>

            <div className="h-28 md:h-36 flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
              <div className="min-w-[120px] md:min-w-[160px] h-full bg-[#111114] rounded-2xl border border-white/5 overflow-hidden relative snap-start">
                <video ref={localVideoRef} autoPlay muted playsInline className={`w-full h-full object-cover mirror ${isVideoOff ? 'hidden' : ''}`} />
                {isVideoOff && <div className="absolute inset-0 flex items-center justify-center text-slate-700"><VideoOff className="w-6 h-6" /></div>}
                <div className="absolute bottom-2 left-2 right-2 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg text-[8px] font-black text-white uppercase truncate">
                  {tx('أنا', 'Me')}
                </div>
              </div>
              {participants.filter(p => p.id !== userId).map(p => (
                <div key={p.id} className="min-w-[120px] md:min-w-[160px] h-full bg-[#111114] rounded-2xl border border-white/5 overflow-hidden relative snap-start">
                  <RemoteVideo stream={remoteStreams[p.id]} isVideoOff={p.isVideoOff} muted={false} className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 left-2 right-2 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center justify-between gap-2 overflow-hidden">
                    <span className="text-[8px] font-black text-white uppercase truncate">{p.name}</span>
                    <VoiceIndicator stream={remoteStreams[p.id]} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`grid h-full gap-4 md:gap-6 ${participants.length <= 1 ? 'grid-cols-1' :
            participants.length <= 2 ? 'grid-cols-1 md:grid-cols-2' :
              participants.length <= 4 ? 'grid-cols-2' :
                'grid-cols-2 lg:grid-cols-3'
            }`}>
            <div className="relative bg-[#0d0d0f] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl transition-all group">
              <video ref={localVideoRef} autoPlay muted playsInline className={`w-full h-full object-cover mirror ${isVideoOff ? 'hidden' : ''}`} />
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-900/20 to-black">
                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                    <VideoOff className="w-10 h-10 text-slate-500" />
                  </div>
                </div>
              )}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2 border border-white/5">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">{userName} {tx('(أنت)', '(You)')}</span>
                  {isMuted && <MicOff className="w-3 h-3 text-red-500" />}
                </div>
                {isHost && <Shield className="w-4 h-4 text-indigo-400" />}
              </div>
            </div>

            {participants.filter(p => p.id !== userId).map(p => (
              <div key={p.id} className="relative bg-[#0d0d0f] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl transition-all group">
                <RemoteVideo stream={remoteStreams[p.id]} isVideoOff={p.isVideoOff} muted={false} className="w-full h-full object-cover" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
                  <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-3 border border-white/5">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{p.name}</span>
                    <VoiceIndicator stream={remoteStreams[p.id]} />
                    {p.isMuted && <MicOff className="w-3 h-3 text-red-500" />}
                  </div>
                  {isHost && (
                    <button
                      onClick={() => removeParticipant(p.id)}
                      className="p-3 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-xl transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] w-max max-w-[95vw] pointer-events-auto select-none isolate">
        <div className="bg-[#0f0f12]/95 backdrop-blur-3xl px-4 md:px-8 py-3 md:py-4 rounded-[2rem] md:rounded-[2.5rem] border border-white/20 shadow-[0_30px_60px_rgba(0,0,0,0.8)] flex items-center gap-3 md:gap-6 pointer-events-auto">
          <button onClick={toggleMic} className={`p-4 md:p-5 rounded-xl md:rounded-2xl transition-all cursor-pointer active:scale-95 pointer-events-auto ${isMuted ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'}`}>
            {isMuted ? <MicOff className="w-5 h-5 md:w-6 md:h-6" /> : <Mic className="w-5 h-5 md:w-6 md:h-6" />}
          </button>
          <button onClick={toggleCamera} className={`p-4 md:p-5 rounded-xl md:rounded-2xl transition-all cursor-pointer active:scale-95 pointer-events-auto ${isVideoOff ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'}`}>
            {isVideoOff ? <VideoOff className="w-5 h-5 md:w-6 md:h-6" /> : <Camera className="w-5 h-5 md:w-6 md:h-6" />}
          </button>
          <button onClick={shareScreen} className={`p-4 md:p-5 rounded-xl md:rounded-2xl transition-all cursor-pointer active:scale-95 pointer-events-auto ${isSharing ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'}`}>
            {isSharing ? <ScreenShare className="w-5 h-5 md:w-6 md:h-6" /> : <Monitor className="w-5 h-5 md:w-6 md:h-6" />}
          </button>
          {isHost && (
            <button onClick={muteAll} className="p-4 md:p-5 rounded-xl md:rounded-2xl bg-white/5 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer active:scale-95 pointer-events-auto" title={tx('كتم صوت الجميع', 'Mute All')}>
              <VolumeX className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          )}
          <div className="w-px h-8 md:h-10 bg-white/10 mx-1 md:mx-2" />
          <button onClick={leaveRoom} className="p-4 md:p-5 bg-red-600 hover:bg-red-500 text-white rounded-xl md:rounded-2xl transition-all shadow-lg shadow-red-600/20 cursor-pointer active:scale-95 pointer-events-auto">
            <LogOut className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

const RemoteVideo: React.FC<{ stream?: MediaStream; isVideoOff?: boolean; muted?: boolean; className?: string }> = ({ stream, isVideoOff, muted = true, className = '' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      const playVideo = async () => {
        try {
          if (videoRef.current) await videoRef.current.play();
        } catch (err) {
          console.warn("Auto-play blocked, wait for user interaction");
        }
      };
      playVideo();
    }
  }, [stream]);

  return (
    <>
      <video ref={videoRef} autoPlay playsInline muted={muted} className={`${className} ${isVideoOff ? 'hidden' : ''}`} />
      {isVideoOff && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-900/10 to-black">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/5 opacity-50">
            <VideoOff className="w-8 h-8 text-slate-600" />
          </div>
        </div>
      )}
    </>
  );
};

const VoiceIndicator: React.FC<{ stream?: MediaStream }> = ({ stream }) => {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!stream || !stream.getAudioTracks().length) {
      setLevel(0);
      return;
    }
    
    let audioContext: AudioContext;
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let animationFrame: number;
      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const average = sum / bufferLength;
        setLevel(average);
        animationFrame = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      return () => {
        cancelAnimationFrame(animationFrame);
        audioContext.close();
      };
    } catch (e) {
      console.error("Audio indicator failed", e);
    }
  }, [stream]);

  if (level < 10) return null;

  return (
    <div className="flex gap-0.5 items-end h-2.5 px-0.5">
      {[1, 2, 3].map(i => (
        <div 
          key={i} 
          className="w-0.5 bg-cyan-400 rounded-full transition-all duration-75"
          style={{ height: `${Math.min(100, (level / 100) * 100 * (i === 2 ? 1.5 : 1))}%` }}
        />
      ))}
    </div>
  );
};

const AR_STYLE = `
  .mirror { transform: scaleX(-1); }
  button { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
  .scrollbar-none::-webkit-scrollbar { display: none; }
  .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
`;

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

export default StudyRoomView;
