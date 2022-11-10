import { Html } from '@react-three/drei';
import { observer } from 'mobx-react-lite';
import { ReactComponent as IcAlarm } from './alarm.svg';

const Alarm = observer(() => {
    return (
        <Html as='div' style={{ position: 'relative' }}>
            <IcAlarm />
        </Html>
    );
});

export default Alarm;
