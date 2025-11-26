import { observer } from 'mobx-react-lite';
import { useParams } from 'react-router-dom';
import AI from '../../../components/AIAssistant/AIAssistant';
import './tabset.scss';

const AIAssistant = observer(() => {
    const { id, exerciseId } = useParams();
    const exerciseIdParam = id || exerciseId;

    return (
        <div className="ai-assistant">
            <AI 
                defaultOpen 
                exerciseId={exerciseIdParam}
                autoMessage="Hãy hướng dẫn tôi cách làm bài tập này từng bước một cách chi tiết."
            />
        </div>
    );
});

export default AIAssistant;
