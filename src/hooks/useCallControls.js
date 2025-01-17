import {useAgoraClient} from "./useAgoraClient";
import {useCallback, useContext, useState} from "react";
import AgoraRTC from 'agora-rtc-sdk-ng';
import {useScreenShareClient} from "./useScreenShareClient";
import {AgoraContext} from "../context/AgoraContext";
import {useRTMControls} from "./useRTMControls";
import {useRTMClient} from "./useRTMClient";

export const useCallControls = () => {

    const client = useAgoraClient();
    const rtmClient = useRTMClient();
    const [screenShareClient, setScreenShareClient] = useScreenShareClient();
    const {appId, localVideoDiv, setLocalVideoDiv} = useContext(AgoraContext);
    const [isScreenSharing, setScreenShare] = useState(false);

    const {leave: leaveRTM} = useRTMControls();

 

    const toggleAudio = useCallback(async () => {
        const audioTrack = client.localTracks.filter(track => track.trackMediaType === "audio");
        if (audioTrack.length <= 0) {
            try {
                const audio = await AgoraRTC.createMicrophoneAudioTrack({
                    encoderConfig: "high_quality_stereo",
                  });
                await client.publish(audio);
            } catch (error) {
                console.log(error);
            }
            return;
        }
        audioTrack.map((audio) => {
            audio.stop();
            audio.close();
        
            try {
                client.unpublish(audio);
            } catch (error) {
                console.log(error);
            }
        });
    }, [client]);


    const leaveCall = useCallback(async () => {
        try {
            if (rtmClient)
                await leaveRTM();
            const audioTrack = client.localTracks.filter(track => track.trackMediaType === "audio");
            const audio = audioTrack[0];
            if (audio) {
                audio.stop();
                audio.close();
            }
            const videoTrack = client.localTracks.filter(track => track.trackMediaType === "video");
            const video = videoTrack[0];
            if (video) {
                video.stop();
                video.close();
            }
            await client.leave();
        } catch (error) {
            console.log(error);
            return error;
        }
    }, [client, rtmClient, leaveRTM]);


    const startScreenShare = useCallback(async ({channel, token}) => {
        if (!screenShareClient) {
            try {

                const screenTrack = await AgoraRTC.createScreenVideoTrack({
                    encoderConfig: {
                        height: 1080,
                        width: 1920
                    }
                });
                await client.publish(screenTrack);
                setScreenShareClient(client);

                screenTrack.play(localVideoDiv);
                setLocalVideoDiv(localVideoDiv);

            } catch (error) {
                console.log(error);
                return error;
            }
        }
    }, [client]);

    const stopScreenShare = useCallback(async () => {
        try {
            if (screenShareClient) {
                const videoTrack = screenShareClient.localTracks;
                if (videoTrack.length > 0) {
                    videoTrack[0].stop();
                    videoTrack[0].close();
                }
                await screenShareClient.leave();
                setScreenShare(false);
                setScreenShareClient(null);
            }
        } catch (error) {
            console.log(error);
            return error;
        }
    }, [screenShareClient]);

    const setLocalDivId = useCallback((id) => {
        setLocalVideoDiv(id)
    }, [setLocalVideoDiv]);

    return {
        toggleAudio,
        leaveCall,
        startScreenShare,
        stopScreenShare,
        setLocalDivId
    };
}
