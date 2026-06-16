import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import './App.css'

const socket = io(import.meta.env.VITE_BACKEND_URL)
const servers = {
    iceServers: [
        {
            urls: [
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302'
            ],
        },
    ],
    iceCandidatePoolSize: 10,
}

export default function App() {
    const [callId, setCallId] = useState("") 
    const [joined, setJoined] = useState(false) 
    const [webcamActive, setWebcamActive] = useState(false) 
    const [isCaller, setIsCaller] = useState(false) 

    const pc = useRef(new RTCPeerConnection(servers)) 
    const localStream = useRef(null) 
    const remoteStream = useRef(null) 

    const localVideoRef = useRef(null) 
    const remoteVideoRef = useRef(null) 

    const uid = () => Date.now().toString(36) + Math.random().toString(36).substr(2) 

    useEffect(() => {
        socket.on("connect", () => {
            console.log("connected to signalling server: ", socket.id)
        })

        socket.on("answer", ({ answer }) => {
            console.log("Received answer from callee", answer) 
            const answerDescription = new RTCSessionDescription(answer) 
            pc.current.setRemoteDescription(answerDescription) 
        }) 

        socket.on("ice-candidate", ({ candidate }) => {
            console.log("Received ICE candidate from callee", candidate) 
            const iceCandidate = new RTCIceCandidate(candidate) 
            pc.current.addIceCandidate(iceCandidate) 
        }) 

        socket.on("hangup", () => {
            console.log("The other peer hung up");
            
            if (localStream.current) {
                localStream.current.getTracks().forEach(track => track.stop());
            }
            pc.current.close();
            pc.current = new RTCPeerConnection(servers);

            if (localVideoRef.current) localVideoRef.current.srcObject = null;
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

            setCallId("");
            setJoined(false);
            setWebcamActive(false);
            setIsCaller(false);
        });


        return () => {
            socket.off("connect") 
            socket.off("answer") 
            socket.off("ice-candidate") 
        } 
    }, [])

    const startWebcam = async () => {
        localStream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        remoteStream.current = new MediaStream()

        //pushing both tracks to wrtc connection
        localStream.current.getTracks().forEach((track) => {
            pc.current.addTrack(track, localStream.current) 
        })


        //listener for incoming stream
        pc.current.ontrack = (event) => {
            event.streams[0].getTracks().forEach((track) => {
                remoteStream.current.addTrack(track) 
            })
        }


        //attaching to the ui object
        localVideoRef.current.srcObject = localStream.current 
        remoteVideoRef.current.srcObject = remoteStream.current 

        setWebcamActive(true) 
    }

    const handleCreateCall = () => {
        setIsCaller(true) 
        const generatedId = uid()
        setCallId(generatedId)

        pc.current.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("ice-candidate", {
                    room: generatedId,
                    candidate: event.candidate,
                    type: "caller"
                })
                console.log("Pushed caller ICE candidate:", event.candidate) 
            }
        }

        socket.emit("join_room", { call_id: generatedId }, async (response) => {
            if (response.status === "ok") {
                console.log(`Joined room call:${generatedId} successfully`, response.data) 
                setJoined(true) 

                // Create offer
                const offerDescription = await pc.current.createOffer() 
                await pc.current.setLocalDescription(offerDescription) 

                const offer = {
                    sdp: offerDescription.sdp,
                    type: offerDescription.type,
                } 

                // Send the offer to the remote peer via the signaling server
                socket.emit("offer", { room: generatedId, offer }) 
                console.log("Pushed offer from caller", offer) 
            } else {
                console.error("Unable to join room:", response.error) 
            }
        })
    }

    const handleAnswerCall = (e) => {
        e.preventDefault()
        if (!callId) return 

         pc.current.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("ice-candidate", {
                    room: callId,
                    candidate: event.candidate,
                    type: "callee"
                }) 
                console.log("Pushed callee ICE candidate:", event.candidate) 
            }
        } 

        socket.emit("join_room", { call_id: callId }, async (response) => {
            if (response.status === "ok") {
                console.log("Joined call successfully as joiner") 
                setJoined(true) 
                const offer = response.data.offer 
                if (offer) {
                    console.log("Received offer from server", offer) 

                    // 3. Set remote description (the caller's offer)
                    const offerDescription = new RTCSessionDescription(offer) 
                    await pc.current.setRemoteDescription(offerDescription) 

                    // 4. Create SDP answer
                    const answerDescription = await pc.current.createAnswer() 
                    await pc.current.setLocalDescription(answerDescription) 
                    const answer = {
                        sdp: answerDescription.sdp,
                        type: answerDescription.type
                    } 

                    socket.emit("answer", { room: callId, answer }) 
                    console.log("Pushed answer from callee", answer) 
                } else {
                    console.error("No offer found in this room!") 
                }
            } else {
                console.error("Unable to join room:", response.error) 
            }
        })
    }

    const handleHangUp = () => {
        socket.emit("hangup", { room: callId }) 
        if (localStream.current) {
            localStream.current.getTracks().forEach(track => track.stop()) 
        }
        pc.current.close() 

        //reinit connection for start/join new calls
        pc.current = new RTCPeerConnection(servers) 

        //Reset the video players 
        if (localVideoRef.current) localVideoRef.current.srcObject = null 
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null 
        
        setCallId("") 
        setJoined(false) 
        setWebcamActive(false) 
        setIsCaller(false) 
    }

    return (
        <>
            <div className="top">
                <h2>Start your webcam</h2>
                <div className="streams">
                    <span>
                        <h3>localStream</h3>
                        <video ref={localVideoRef} autoPlay playsinline></video>
                    </span>
                    <span>
                        <h3>remoteStream</h3>
                        <video ref={remoteVideoRef} autoPlay playsinline></video>
                    </span>
                </div>
                <button onClick={startWebcam}>Start webcam</button>
            </div>
            <div className="middleOne">
                <h2>Create a new call</h2>
                <button className="offer-btn" onClick={handleCreateCall} disabled={!webcamActive || joined}>create a new call (offer)</button>
            </div>
            <div className="middleTwo">
                <h2>Join a call</h2>
                <form className="answer form" onSubmit = {handleAnswerCall}>
                    <input type="text" value={callId} onChange={(e) => setCallId(e.target.value)} placeholder="Call ID" />
                    <button disabled={!webcamActive || isCaller || joined}>answer</button>
                </form>
            </div>
            <div className="bottom">
                <h2>Hangup</h2>
                <button className="hangup" disabled={!joined} onClick = {handleHangUp}>hang up</button>
            </div>
        </>
    )
}