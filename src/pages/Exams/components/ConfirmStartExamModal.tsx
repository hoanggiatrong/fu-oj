import { Button, Modal } from 'antd';
import { observer } from 'mobx-react-lite';

interface ConfirmStartExamModalProps {
    open: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

const ConfirmStartExamModal = observer(({ open, onCancel, onConfirm }: ConfirmStartExamModalProps) => {
    return (
        <Modal
            title="Bạn có chắc chắn muốn làm bài không?"
            open={open}
            onCancel={onCancel}
            footer={null}
        >
            <p>Bạn sẽ bắt đầu làm bài thi này.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
                <Button onClick={onCancel}>Không</Button>
                <Button type="primary" onClick={onConfirm}>
                    Có
                </Button>
            </div>
        </Modal>
    );
});

export default ConfirmStartExamModal;

