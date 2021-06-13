import {useContext} from "react";
import {AgoraContext} from '../context/AgoraContext';

export const useScreenClient = () => {
    const {screenShareClient} = useContext(AgoraContext);

    return screenShareClient;
}
