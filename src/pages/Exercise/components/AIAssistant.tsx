import { observer } from 'mobx-react-lite';
import AI from '../../../components/AIAssistant/AIAssistant';
import './tabset.scss';

const AIAssistant = observer(() => {
    return (
        <div className="ai-assistant">
            <AI defaultOpen />
        </div>
    );
});

export default AIAssistant;
