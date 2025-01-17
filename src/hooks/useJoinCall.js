import {useEffect, useState, useContext, useCallback} from 'react';
import {useAgoraClient} from "./useAgoraClient";
import {useRTMClient} from "./useRTMClient";
import AgoraRTC from "agora-rtc-sdk-ng";
import {AgoraContext} from "../context/AgoraContext";

export const useJoinCall = ({channel, token, userId, localVideoDiv, isHost, lazy, mode, rtmToken}) => {

    const [loading, setLoading] = useState(true);
    const [localUserId, setLocalUserId] = useState(null);
    const [isShare, setIsShare] = useState(null);
    const [error, setError] = useState(null);
    const [retry, setRetry] = useState(false);
    const rtcClient = useAgoraClient();
    const {appId, setRTMChannel, setLocalVideoDiv, rtmClient} = useContext(AgoraContext);

    const joinCall = useCallback(async () => {
        try {
            if (isHost) {
                await rtcClient.setClientRole('host');
            }
            const uid = await rtcClient.join(appId, channel, token, userId);
            setLocalUserId(uid);
            rtcClient.enableAudioVolumeIndicator();
            await rtmClient.login({rtmToken, uid: `${uid}`});
            const rtmChannel = rtmClient.createChannel(channel);
            setRTMChannel(rtmChannel);
            await rtmChannel.join();
        } catch (error) {
            console.log(error);
        }
    }, [rtcClient, rtmClient, appId, channel, token, userId, isHost, setLocalUserId, setRTMChannel, rtmToken]);

    const publishTracks = useCallback(async () => {
        try {
            if (mode === 'live') {
                if (isHost) {
                    const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
                        encoderConfig: "high_quality_stereo",
                      });
                    await rtcClient.publish(audioTrack);
                }
            } else {
                const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
                    encoderConfig: "high_quality_stereo",
                  });
                await rtcClient.publish(audioTrack);
            }

            


        } catch (error) {
            //TODO: Report error when audio permissions are denied
            console.log(error);
        }
        console.log("isShare:",isShare);
        if(isShare){

            try {
                const screenTrack = await AgoraRTC.createScreenVideoTrack({
                    encoderConfig: {
                        height: 1080,
                        width: 1920
                    }
                });

                
                screenTrack.play(localVideoDiv);
                setLocalVideoDiv(localVideoDiv);

                if (mode === 'live') {
                    if (isHost) {
                        await rtcClient.publish(screenTrack);
                    }
                } else {
                    await rtcClient.publish(screenTrack);
                }
            } catch (error) {
                //TODO: Report error when video permissions are denied
                console.log(error);
            }
        }

    }, [isHost, rtcClient, localVideoDiv, setLocalVideoDiv, isShare]);

    const startCallAndStream = useCallback(() => {
        
        joinCall()
            .then(() => {
                console.log("then k andar hu")
                publishTracks()
            })
            .then(() => setLoading(false))
            .catch(error => {
                setLoading(false);
                setError(error)
            });
    }, [joinCall, publishTracks, setLoading, setError]);

    useEffect(() => {
        if (!lazy) {
            joinCall()
                .then(() => publishTracks())
                .then(() => setLoading(false))
                .catch(error => {
                    setLoading(false);
                    setError(error)
                });
        }

    }, [joinCall, publishTracks, setLoading, setError, lazy]);

    const retryConnect = () => {
        setRetry(retry => !retry);
    }

    const shareScreen = (share) => {
        console.log("ebennn1", isShare);
        setIsShare(share);
        console.log("ebennn2", isShare);
    }

    return {
        loading,
        error,
        localUserId,
        retryConnect,
        startCall: startCallAndStream,
        shareScreen
    };
}
