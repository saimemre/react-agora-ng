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

 

    const toggleAudio = useCallback(async ({mute}) => {
        const audioTrack = client.localTracks.filter(track => track.trackMediaType === "audio");
        if (mute === 0) {
            console.log("false içinde");
            try {
                const audio = await AgoraRTC.createMicrophoneAudioTrack();
                await client.publish(audio);
            } catch (error) {
                console.log(error);
            }
            return;
        }else{
            console.log("true içinde");
            const audio = audioTrack[0];
            audio.stop();
            audio.close();
            try {

                await client.unpublish(audio);
            } catch (error) {
                console.log(error);
            }
        }
        
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
        const shareClient = AgoraRTC.createClient({mode: "rtc", codec: "vp8"});
        if (!screenShareClient) {
            try {
                console.log('shareclienta geldik', shareClient)
                await shareClient.join(appId, channel, token);

                const screenTrack = await AgoraRTC.createScreenVideoTrack({
                    encoderConfig: {
                        height: 1080,
                        width: 1920
                    }
                });
                await shareClient.publish(screenTrack);
                setScreenShareClient(shareClient);
                console.log('Client', shareClient)

            } catch (error) {
                console.log(error);
                return error;
            }
        }
    }, [setScreenShareClient, screenShareClient, appId]);

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
