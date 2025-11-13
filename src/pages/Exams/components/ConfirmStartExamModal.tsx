import { Button, Modal } from 'antd';
import { observer } from 'mobx-react-lite';
import dayjs from 'dayjs';
import { getExamStatus } from '../utils';

interface ConfirmStartExamModalProps {
    open: boolean;
    onCancel: () => void;
    onConfirm: () => void;
    examRecord?: { startTime?: string | null; endTime?: string | null; title?: string } | null;
}

const ConfirmStartExamModal = observer(({ open, onCancel, onConfirm, examRecord }: ConfirmStartExamModalProps) => {
    const examStatus = examRecord ? getExamStatus(examRecord.startTime, examRecord.endTime) : null;
    const isUpcoming = examStatus?.status === 'upcoming';
    const startTime = examRecord?.startTime ? dayjs(examRecord.startTime).format('DD/MM/YYYY HH:mm') : null;

    return (
        <Modal
            title={isUpcoming ? 'Tham gia bài thi' : 'Bạn có chắc chắn muốn làm bài không?'}
            open={open}
            onCancel={onCancel}
            footer={null}
        >
            {isUpcoming ? (
                <>
                    <p>Bạn sẽ tham gia bài thi này để xem thông tin và chuẩn bị.</p>
                    {startTime && (
                        <p style={{ marginTop: '12px', color: '#1890ff', fontWeight: 500 }}>
                            Bài thi sẽ bắt đầu vào: <strong>{startTime}</strong>
                        </p>
                    )}
                    <p style={{ marginTop: '8px', fontSize: '13px', color: '#666' }}>
                        Bạn có thể xem danh sách bài tập và thông tin chi tiết, nhưng chỉ có thể làm bài khi bài thi bắt đầu.
                    </p>
                </>
            ) : (
                <p>Bạn sẽ bắt đầu làm bài thi này.</p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
                <Button onClick={onCancel}>Không</Button>
                <Button type="primary" onClick={onConfirm}>
                    {isUpcoming ? 'Tham gia' : 'Có'}
                </Button>
            </div>
        </Modal>
    );
});

export default ConfirmStartExamModal;

