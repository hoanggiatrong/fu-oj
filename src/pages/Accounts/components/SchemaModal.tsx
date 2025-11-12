import { Modal, Button } from 'antd';
import { observer } from 'mobx-react-lite';
import Editor from '@monaco-editor/react';
import './schema-modal.scss';

interface SchemaModalProps {
    open: boolean;
    onCancel: () => void;
}

const SchemaModal = observer(({ open, onCancel }: SchemaModalProps) => {
    const sampleSchema = {
        accounts: [
            {
                email: 'student1@example.com',
                firstName: 'Nguyễn',
                lastName: 'Văn A',
                rollNumber: 'HE123456',
                role: 'STUDENT',
                password: 'Password123!'
            },
            {
                email: 'instructor1@example.com',
                firstName: 'Trần',
                lastName: 'Thị B',
                rollNumber: '',
                role: 'INSTRUCTOR',
                password: 'Password123!'
            },
            {
                email: 'admin1@example.com',
                firstName: 'Lê',
                lastName: 'Văn C',
                rollNumber: '',
                role: 'ADMIN',
                password: 'Password123!'
            }
        ],
        requiredFields: ['email', 'role', 'password'],
        optionalFields: ['firstName', 'lastName', 'rollNumber'],
        roleValues: ['STUDENT', 'INSTRUCTOR', 'ADMIN'],
        notes: [
            'Email phải là duy nhất trong hệ thống',
            'Password phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt',
            'Role phải là một trong: STUDENT, INSTRUCTOR, ADMIN',
            'RollNumber chỉ bắt buộc cho STUDENT'
        ]
    };

    const jsonString = JSON.stringify(sampleSchema, null, 2);

    return (
        <Modal
            title="Schema Import Tài Khoản"
            open={open}
            onCancel={onCancel}
            width={800}
            footer={[
                <Button key="close" onClick={onCancel}>
                    Đóng
                </Button>
            ]}
        >
            <div className="schema-modal">
                <div className="schema-info">
                    <h4>Định dạng dữ liệu import:</h4>
                    <p>File Excel/CSV cần có các cột sau:</p>
                    <ul>
                        <li>
                            <strong>email</strong> (bắt buộc) - Email đăng nhập, phải là duy nhất
                        </li>
                        <li>
                            <strong>password</strong> (bắt buộc) - Mật khẩu, tối thiểu 8 ký tự
                        </li>
                        <li>
                            <strong>role</strong> (bắt buộc) - Vai trò: STUDENT, INSTRUCTOR, hoặc ADMIN
                        </li>
                        <li>
                            <strong>firstName</strong> (tùy chọn) - Họ
                        </li>
                        <li>
                            <strong>lastName</strong> (tùy chọn) - Tên
                        </li>
                        <li>
                            <strong>rollNumber</strong> (tùy chọn) - Mã số sinh viên
                        </li>
                    </ul>
                </div>
                <div className="schema-editor">
                    <h4>JSON Schema mẫu:</h4>
                    <Editor
                        height="400px"
                        defaultLanguage="json"
                        value={jsonString}
                        options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            fontSize: 14,
                            wordWrap: 'on'
                        }}
                    />
                </div>
            </div>
        </Modal>
    );
});

export default SchemaModal;

