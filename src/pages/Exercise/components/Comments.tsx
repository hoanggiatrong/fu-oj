import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { Avatar, Button, Input, List, message as antMessage } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import * as http from '../../../lib/httpRequest';
import './tabset.scss';
import utils from '../../../utils/utils';

const { TextArea } = Input;

interface Comment {
    id: string;
    content: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    createdBy: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    createdAt: string;
    createdTimestamp: any;
    replies?: Comment[];
}

const Comments = observer(({ exerciseId }: { exerciseId: string | undefined }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newComment, setNewComment] = useState('');

    const fetchComments = async () => {
        if (!exerciseId) return;

        setLoading(true);
        try {
            const response = await http.get(`/exercises/${exerciseId}/comments?pageSize=100`);
            setComments(response.data || []);
        } catch (error: any) {
            antMessage.error('Không thể tải comments. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [exerciseId]);

    const handleSubmitComment = async () => {
        if (!exerciseId || !newComment.trim()) return;

        setSubmitting(true);
        try {
            await http.post(`/exercises/${exerciseId}/comments`, {
                content: newComment.trim(),
                parentId: null
            });
            setNewComment('');
            antMessage.success('Đã thêm comment thành công!');
            fetchComments();
        } catch (error: any) {
            antMessage.error(error?.response?.data?.message || 'Không thể thêm comment. Vui lòng thử lại sau.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="comments-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                <List
                    loading={loading}
                    dataSource={comments}
                    locale={{ emptyText: 'Chưa có comment nào. Hãy là người đầu tiên bình luận!' }}
                    renderItem={(comment) => (
                        <List.Item style={{ borderBottom: '1px solid #333', padding: '12px 0' }}>
                            <List.Item.Meta
                                avatar={
                                    <Avatar
                                        style={{
                                            backgroundColor: '#ff6b35',
                                            color: '#fff'
                                        }}
                                    >
                                        {comment.createdBy?.firstName?.[0]?.toUpperCase() ||
                                            comment.createdBy?.email?.[0]?.toUpperCase() ||
                                            'U'}
                                    </Avatar>
                                }
                                title={
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <span style={{ color: '#fff', fontWeight: 500 }}>
                                            {comment.user?.firstName && comment.user?.lastName
                                                ? `${comment.user.firstName} ${comment.user.lastName}`
                                                : comment.user?.email || 'Anonymous'}
                                        </span>
                                        <span style={{ color: '#999', fontSize: '12px' }}>
                                            {utils.formatDate(comment.createdTimestamp, 'DD/MM/YYYY HH:mm')}
                                        </span>
                                    </div>
                                }
                                description={
                                    <div style={{ color: '#ccc', marginTop: '8px', whiteSpace: 'pre-wrap' }}>
                                        {comment.content}
                                    </div>
                                }
                            />
                            {comment.replies && comment.replies.length > 0 && (
                                <div style={{ marginLeft: '48px', marginTop: '12px' }}>
                                    {comment.replies.map((reply) => (
                                        <div
                                            key={reply.id}
                                            style={{
                                                borderLeft: '2px solid #444',
                                                paddingLeft: '12px',
                                                marginBottom: '12px'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                                                <Avatar
                                                    size={24}
                                                    style={{
                                                        backgroundColor: '#ff6b35',
                                                        color: '#fff',
                                                        marginRight: '8px'
                                                    }}
                                                >
                                                    {reply.createdBy?.firstName?.[0]?.toUpperCase() ||
                                                        reply.createdBy?.email?.[0]?.toUpperCase() ||
                                                        'U'}
                                                </Avatar>
                                                <span style={{ color: '#fff', fontSize: '13px', marginRight: '8px' }}>
                                                    {reply.createdBy?.firstName && reply.createdBy?.lastName
                                                        ? `${reply.createdBy.firstName} ${reply.createdBy.lastName}`
                                                        : reply.createdBy?.email || 'Anonymous'}
                                                </span>
                                                <span style={{ color: '#999', fontSize: '11px' }}>
                                                    {formatDate(reply.createdAt)}
                                                </span>
                                            </div>
                                            <div style={{ color: '#ccc', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
                                                {reply.content}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </List.Item>
                    )}
                />
            </div>
            <div className="pt-8 border-top">
                <div className="flex gap p-4">
                    <Input.TextArea
                        className="overflow"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Viết comment của bạn..."
                        rows={2}
                        style={{
                            backgroundColor: '#2a2a2a',
                            color: '#fff',
                            borderColor: '#444',
                            resize: 'none'
                        }}
                        onPressEnter={(e) => {
                            if (e.shiftKey) return;
                            e.preventDefault();
                            handleSubmitComment();
                        }}
                        showCount
                        maxLength={255}
                    />
                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={handleSubmitComment}
                        loading={submitting}
                        disabled={!newComment.trim()}
                        style={{ alignSelf: 'flex-end' }}
                    >
                        Gửi
                    </Button>
                </div>
            </div>
        </div>
    );
});

export default Comments;
