import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as http from '../../../lib/httpRequest';
import ExercisesTable from './ExercisesTable';

const ExercisesTab = observer(() => {
    const { id } = useParams();
    const [exercises, setExercises] = useState<any[]>([]);

    useEffect(() => {
        if (id) {
            const url = `/groups/${id}/exercises`;
            console.log('[API] GET', url, '- Fetching exercises for group:', id);
            http.get(url)
                .then((res) => {
                    console.log('[API] GET', url, '- Success:', res.data);
                    setExercises(res.data || []);
                })
                .catch((error) => {
                    console.error('[API] GET', url, '- Error:', error);
                    setExercises([]);
                });
        }
    }, [id]);

    return <ExercisesTable dataSource={exercises} />;
});

export default ExercisesTab;

