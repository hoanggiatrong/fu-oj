import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Button, Input, List, Modal, message as antMessage } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import type { IMessage } from '@stomp/stompjs';
import stompClient from '../../../lib/stomp-client.lib';
import * as http from '../../../lib/httpRequest';
import authentication from '../../../shared/auth/authentication';
import './tabset.scss';
import utils from '../../../utils/utils';
import classnames from 'classnames';

interface UserProfile {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
}

interface CommentDTO {
    id: string;
    content: string;
    exerciseId: string;
    parentId: string | null;
    createdBy: string;
    createdTimestamp: string;
    updatedBy: string;
    updatedTimestamp: string;
    deletedTimestamp?: string | null;
    user: UserProfile;
    reportCount?: number;
}

interface CommentEventPayload {
    type: 'CREATED' | 'UPDATED' | 'DELETED' | 'READ';
    exerciseId: string;
    parentId?: string | null;
    commentId?: string;
    data?: CommentDTO | null;
    timestamp: number;
}

type CommentNode = CommentDTO & { replies: CommentNode[] };

const Comments = observer(({ exerciseId }: { exerciseId: string | undefined }) => {
    const [comments, setComments] = useState<CommentNode[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newComment, setNewComment] = useState('');
    const replySubscriptionsRef = useRef<Record<string, { unsubscribe: () => void }>>({});
    const mainSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
    const repliesLoadedRef = useRef<Set<string>>(new Set());
    const stompHandlerRef = useRef<((message: IMessage) => void) | null>(null);
    const [activeReplyParent, setActiveReplyParent] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [replySubmitting, setReplySubmitting] = useState(false);
    const [reportingId, setReportingId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState('');
    const [editingSubmitting, setEditingSubmitting] = useState(false);
    const [visibleTopCount, setVisibleTopCount] = useState(5);
    const [replyVisibleMap, setReplyVisibleMap] = useState<Record<string, number>>({});
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

    const currentUserId = authentication.account?.data?.id;

    const normalizeComment = (data: CommentDTO, existing?: CommentNode | null): CommentNode => ({
        ...data,
        parentId: data.parentId ?? null,
        replies: existing?.replies ?? []
    });

    const sortByTimestamp = (list: CommentNode[]) =>
        [...list].sort((a, b) => new Date(a.createdTimestamp).getTime() - new Date(b.createdTimestamp).getTime());

    const upsertComment = (list: CommentNode[], incoming: CommentNode) => {
        const next = [...list];
        const idx = next.findIndex((item) => item.id === incoming.id);

        if (idx === -1) {
            next.push({ ...incoming, replies: incoming.replies ?? [] });
            return sortByTimestamp(next);
        }

        const existing = next[idx];
        next[idx] = { ...incoming, replies: incoming.replies ?? existing.replies ?? [] };
        return sortByTimestamp(next);
    };

    const removeComment = (list: CommentNode[], commentId: string) => list.filter((item) => item.id !== commentId);

    const updateCommentInTree = (
        list: CommentNode[],
        targetId: string,
        updater: (node: CommentNode) => CommentNode
    ): CommentNode[] =>
        list.map((item) => {
            if (item.id === targetId) {
                return updater(item);
            }
            if (item.replies && item.replies.length > 0) {
                return {
                    ...item,
                    replies: updateCommentInTree(item.replies, targetId, updater)
                };
            }
            return item;
        });

    const cleanupSubscriptions = useCallback(() => {
        mainSubscriptionRef.current?.unsubscribe();
        mainSubscriptionRef.current = null;
        Object.values(replySubscriptionsRef.current).forEach((sub) => sub.unsubscribe());
        replySubscriptionsRef.current = {};
    }, []);

    const subscribeToReplies = useCallback(
        (parentId: string) => {
            if (!exerciseId || !parentId || replySubscriptionsRef.current[parentId]) return;
            console.log('[Comments] Subscribing to replies topic', `/topic/comments/${exerciseId}/${parentId}`);
            replySubscriptionsRef.current[parentId] = stompClient.subscribe({
                destination: `/topic/comments/${exerciseId}/${parentId}`,
                onMessage: (msg) => stompHandlerRef.current?.(msg)
            });
        },
        [exerciseId]
    );

    const handleStompMessage = useCallback(
        (message: IMessage) => {
            try {
                console.log('[Comments] Raw WS message', message.body);
                const payload: CommentEventPayload = JSON.parse(message.body);
                if (!payload) return;
                const normalized = payload.data ? normalizeComment(payload.data) : null;

                if (payload.type === 'CREATED' && normalized && !payload.parentId) {
                    subscribeToReplies(normalized.id);
                    setComments((prev) => upsertComment(prev, { ...normalized, replies: [] }));
                    return;
                }

                setComments((prev) => {
                    switch (payload.type) {
                        case 'CREATED':
                            if (!normalized || !payload.parentId) return prev;
                            console.log('[Comments] CREATED event', payload);

                            return prev.map((comment) =>
                                comment.id === payload.parentId
                                    ? {
                                          ...comment,
                                          replies: upsertComment(comment.replies ?? [], normalized)
                                      }
                                    : comment
                            );
                        case 'UPDATED':
                            console.log('[Comments] UPDATED event', payload);
                            if (!normalized) return prev;
                            if (!payload.parentId) {
                                return upsertComment(prev, normalized);
                            }
                            return prev.map((comment) =>
                                comment.id === payload.parentId
                                    ? {
                                          ...comment,
                                          replies: upsertComment(comment.replies ?? [], normalized)
                                      }
                                    : comment
                            );
                        case 'DELETED':
                            console.log('[Comments] DELETED event', payload);
                            if (!payload.commentId) return prev;
                            if (!payload.parentId) {
                                return removeComment(prev, payload.commentId);
                            }
                            return prev.map((comment) =>
                                comment.id === payload.parentId
                                    ? {
                                          ...comment,
                                          replies: (comment.replies ?? []).filter(
                                              (reply) => reply.id !== payload.commentId
                                          )
                                      }
                                    : comment
                            );
                        default:
                            return prev;
                    }
                });
            } catch (error) {
                console.error('[Comments] Failed to process websocket message', error);
            }
        },
        [subscribeToReplies]
    );

    stompHandlerRef.current = handleStompMessage;

    const fetchCommentPage = useCallback(
        async (parentId: string | null) => {
            if (!exerciseId) return [];
            const params = {
                pageSize: 100,
                parentId: parentId === null ? 'null' : parentId
            };

            const response = await http.get(`/exercises/${exerciseId}/comments`, { params });
            return (response?.data || []).map((item: CommentDTO) => normalizeComment(item));
        },
        [exerciseId]
    );

    const fetchRepliesForParent = useCallback(
        async (parentId: string, force = false) => {
            if (!exerciseId) return;
            if (!force && repliesLoadedRef.current.has(parentId)) return;
            try {
                const replies = await fetchCommentPage(parentId);
                setComments((prev) =>
                    prev.map((comment) =>
                        comment.id === parentId ? { ...comment, replies: sortByTimestamp(replies) } : comment
                    )
                );
                repliesLoadedRef.current.add(parentId);
                subscribeToReplies(parentId);
            } catch (error) {
                console.error('[Comments] Failed to load replies', error);
            }
        },
        [exerciseId, fetchCommentPage, subscribeToReplies]
    );

    const fetchComments = useCallback(async () => {
        if (!exerciseId) {
            setComments([]);
            return;
        }

        setLoading(true);
        repliesLoadedRef.current.clear();
        try {
            const topLevel = await fetchCommentPage(null);
            setComments(topLevel.map((comment: CommentNode) => ({ ...comment, replies: [] })));
            setVisibleTopCount(5);
            setReplyVisibleMap({});
            await Promise.allSettled(topLevel.map((comment: CommentNode) => fetchRepliesForParent(comment.id)));
        } catch (error: any) {
            antMessage.error('Không thể tải comments. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    }, [exerciseId, fetchCommentPage, fetchRepliesForParent]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    useEffect(() => {
        cleanupSubscriptions();
        if (!exerciseId) return;

        const destination = `/topic/comments/${exerciseId}`;
        console.log('[Comments] Subscribing to main topic', destination);
        mainSubscriptionRef.current = stompClient.subscribe({
            destination,
            onMessage: (msg) => {
                console.log('[Comments] WS message received on main topic', destination, msg.body);
                stompHandlerRef.current?.(msg);
            }
        });

        return () => {
            cleanupSubscriptions();
        };
    }, [exerciseId, cleanupSubscriptions]);

    const toggleReplyBox = useCallback((parentId: string) => {
        setActiveReplyParent((current) => (current === parentId ? null : parentId));
        setReplyContent('');
    }, []);

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
            await fetchComments();
        } catch (error: any) {
            antMessage.error(error?.response?.data?.message || 'Không thể thêm comment. Vui lòng thử lại sau.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReplySubmit = useCallback(async () => {
        if (!exerciseId || !activeReplyParent || !replyContent.trim()) return;

        setReplySubmitting(true);
        const parentId = activeReplyParent;

        try {
            await http.post(`/exercises/${exerciseId}/comments`, {
                content: replyContent.trim(),
                parentId
            });
            setReplyContent('');
            setActiveReplyParent(null);
            antMessage.success('Đã trả lời bình luận!');
            await fetchRepliesForParent(parentId, true);
        } catch (error: any) {
            antMessage.error(error?.response?.data?.message || 'Không thể gửi trả lời. Vui lòng thử lại sau.');
        } finally {
            setReplySubmitting(false);
        }
    }, [activeReplyParent, exerciseId, fetchRepliesForParent, replyContent]);

    const handleReportComment = useCallback(async (commentId: string) => {
        setReportingId(commentId);
        try {
            await http.post(`/comments/report/${commentId}`, {});
            antMessage.success('Đã báo cáo bình luận!');
            setComments((prev) =>
                updateCommentInTree(prev, commentId, (node) => ({
                    ...node,
                    reportCount: (node.reportCount ?? 0) + 1
                }))
            );
        } catch (error: any) {
            antMessage.error(error?.response?.data?.message || 'Không thể báo cáo bình luận. Vui lòng thử lại sau.');
        } finally {
            setReportingId((current) => (current === commentId ? null : current));
        }
    }, []);

    const handleDeleteComment = useCallback((commentId: string) => {
        setDeleteTargetId(commentId);
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        if (!deleteTargetId) return;
        setDeletingId(deleteTargetId);
        try {
            await http.del(`/comments/${deleteTargetId}`);
            antMessage.success('Đã xóa bình luận!');
            // WebSocket DELETED event will update UI for all clients
        } catch (error: any) {
            antMessage.error(error?.response?.data?.message || 'Không thể xóa bình luận. Vui lòng thử lại sau.');
        } finally {
            setDeletingId(null);
            setDeleteTargetId(null);
        }
    }, [deleteTargetId]);

    const handleCancelDelete = useCallback(() => {
        if (deletingId) return; // avoid closing while deleting
        setDeleteTargetId(null);
    }, [deletingId]);

    const handleStartEdit = useCallback((comment: CommentNode) => {
        setEditingId(comment.id);
        setEditingContent(comment.content);
    }, []);

    const handleCancelEdit = useCallback(() => {
        setEditingId(null);
        setEditingContent('');
    }, []);

    const handleSubmitEdit = useCallback(async () => {
        if (!editingId || !editingContent.trim()) return;
        setEditingSubmitting(true);
        try {
            const response = await http.patch(editingId, '/comments', {
                content: editingContent.trim()
            });
            const updated: CommentDTO | undefined = response as CommentDTO;
            if (updated) {
                setComments((prev) => updateCommentInTree(prev, updated.id, (node) => normalizeComment(updated, node)));
            } else {
                // fallback local update
                setComments((prev) =>
                    updateCommentInTree(prev, editingId, (node) => ({
                        ...node,
                        content: editingContent.trim()
                    }))
                );
            }
            // ensure latest data (e.g. from backend transformations / websocket)
            await fetchComments();
            antMessage.success('Đã cập nhật bình luận!');
            setEditingId(null);
            setEditingContent('');
        } catch (error: any) {
            antMessage.error(error?.response?.data?.message || 'Không thể cập nhật bình luận. Vui lòng thử lại sau.');
        } finally {
            setEditingSubmitting(false);
        }
    }, [editingContent, editingId, normalizeComment, fetchComments]);

    const buildDisplayName = useCallback((user?: UserProfile | null) => {
        if (!user) return 'Anonymous';
        if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
        return user.email || 'Anonymous';
    }, []);

    const renderReportLabel = (count?: number | null) => (count && count > 0 ? `Báo cáo (${count})` : 'Báo cáo');

    const renderReplyInput = (parentId: string) => (
        <div
            style={{
                marginTop: '12px',
                padding: '12px',
                backgroundColor: '#1f1f1f',
                borderRadius: '8px'
            }}
        >
            <Input.TextArea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Nhập nội dung trả lời..."
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
                    handleReplySubmit();
                }}
                showCount
                maxLength={255}
            />
            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <Button onClick={() => toggleReplyBox(parentId)} disabled={replySubmitting}>
                    Hủy
                </Button>
                <Button
                    type="primary"
                    onClick={handleReplySubmit}
                    loading={replySubmitting}
                    disabled={!replyContent.trim()}
                >
                    Trả lời
                </Button>
            </div>
        </div>
    );

    const avatarLetter = (user?: UserProfile | null) =>
        user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

    const commentListData = useMemo(() => comments.slice(0, Math.max(visibleTopCount, 1)), [comments, visibleTopCount]);

    return (
        <div className="comments-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                <List
                    loading={loading}
                    dataSource={commentListData}
                    locale={{
                        emptyText: (
                            <p style={{ color: '#464646' }}>Chưa có comment nào. Hãy là người đầu tiên bình luận!</p>
                        )
                    }}
                    renderItem={(comment: CommentNode) => (
                        <List.Item
                            key={comment.id}
                            style={{
                                borderBottom: '1px solid #333',
                                padding: '20px 0',
                                marginBottom: '0'
                            }}
                        >
                            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                                <Avatar
                                    size={40}
                                    style={{
                                        backgroundColor: '#ff6b35',
                                        color: '#fff',
                                        flexShrink: 0
                                    }}
                                >
                                    {avatarLetter(comment.user)}
                                </Avatar>
                                <div style={{ flex: 1 }}>
                                    <div
                                        style={{
                                            backgroundColor: '#1f1f1f',
                                            borderRadius: '16px',
                                            padding: '12px 16px',
                                            color: '#fff'
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '6px'
                                            }}
                                        >
                                            <span style={{ fontWeight: 600 }}>{buildDisplayName(comment.user)}</span>
                                            <span style={{ color: '#999', fontSize: '12px' }}>
                                                {utils.formatDate(comment.createdTimestamp, 'DD/MM/YYYY HH:mm')}
                                            </span>
                                        </div>
                                        {editingId === comment.id ? (
                                            <>
                                                <Input.TextArea
                                                    value={editingContent}
                                                    onChange={(e) => setEditingContent(e.target.value)}
                                                    rows={2}
                                                    style={{
                                                        marginTop: '4px',
                                                        backgroundColor: '#262626',
                                                        color: '#fff',
                                                        borderColor: '#555',
                                                        resize: 'none'
                                                    }}
                                                    maxLength={255}
                                                    showCount
                                                />
                                                <div
                                                    style={{
                                                        marginTop: '8px',
                                                        display: 'flex',
                                                        justifyContent: 'flex-end',
                                                        gap: '8px'
                                                    }}
                                                >
                                                    <Button onClick={handleCancelEdit} disabled={editingSubmitting}>
                                                        Hủy
                                                    </Button>
                                                    <Button
                                                        type="primary"
                                                        onClick={handleSubmitEdit}
                                                        loading={editingSubmitting}
                                                        disabled={!editingContent.trim()}
                                                    >
                                                        Lưu
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <div style={{ color: '#ddd', whiteSpace: 'pre-wrap' }}>
                                                {comment.content}
                                            </div>
                                        )}
                                    </div>
                                    <div
                                        style={{
                                            marginTop: '6px',
                                            display: 'flex',
                                            gap: '16px',
                                            fontSize: '13px',
                                            color: '#9ab'
                                        }}
                                    >
                                        <Button
                                            type="link"
                                            size="small"
                                            style={{ padding: 0 }}
                                            onClick={() => toggleReplyBox(comment.id)}
                                        >
                                            {activeReplyParent === comment.id ? 'Đóng trả lời' : 'Trả lời'}
                                        </Button>
                                        {comment.user?.id === currentUserId && (
                                            <>
                                                <Button
                                                    type="link"
                                                    size="small"
                                                    style={{ padding: 0 }}
                                                    onClick={() => handleStartEdit(comment)}
                                                >
                                                    Sửa
                                                </Button>
                                                <Button
                                                    type="link"
                                                    size="small"
                                                    danger
                                                    style={{ padding: 0 }}
                                                    loading={deletingId === comment.id}
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                >
                                                    Xóa
                                                </Button>
                                            </>
                                        )}
                                        {comment.user?.id !== currentUserId && (
                                            <Button
                                                type="link"
                                                size="small"
                                                danger
                                                style={{ padding: 0 }}
                                                loading={reportingId === comment.id}
                                                onClick={() => handleReportComment(comment.id)}
                                            >
                                                {renderReportLabel(comment.reportCount)}
                                            </Button>
                                        )}
                                    </div>
                                    {activeReplyParent === comment.id && renderReplyInput(comment.id)}

                                    {(comment.replies ?? []).length > 0 && (
                                        <div style={{ marginTop: '16px', paddingLeft: '24px' }}>
                                            {(() => {
                                                const totalReplies = (comment.replies ?? []).length;
                                                const visibleRepliesCount =
                                                    replyVisibleMap[comment.id] ?? Math.min(1, totalReplies);
                                                const visibleReplies = (comment.replies ?? []).slice(
                                                    0,
                                                    visibleRepliesCount
                                                );
                                                return (
                                                    <>
                                                        {visibleReplies.map((reply, index) => {
                                                            const isLast = index === visibleReplies.length - 1;
                                                            return (
                                                                <div
                                                                    key={reply.id}
                                                                    style={{
                                                                        display: 'flex',
                                                                        gap: '10px',
                                                                        marginBottom: '16px',
                                                                        position: 'relative'
                                                                    }}
                                                                >
                                                                    <div
                                                                        style={{
                                                                            position: 'absolute',
                                                                            left: '6px',
                                                                            top: '-10px',
                                                                            bottom: isLast ? '20px' : '-10px',
                                                                            borderLeft: '2px solid #333'
                                                                        }}
                                                                    />
                                                                    <Avatar
                                                                        size={32}
                                                                        style={{
                                                                            backgroundColor: '#ff6b35',
                                                                            color: '#fff',
                                                                            marginLeft: '24px'
                                                                        }}
                                                                    >
                                                                        {avatarLetter(reply.user)}
                                                                    </Avatar>
                                                                    <div style={{ flex: 1 }}>
                                                                        <div
                                                                            style={{
                                                                                backgroundColor: '#262626',
                                                                                borderRadius: '14px',
                                                                                padding: '10px 14px'
                                                                            }}
                                                                        >
                                                                            <div
                                                                                style={{
                                                                                    display: 'flex',
                                                                                    justifyContent: 'space-between',
                                                                                    marginBottom: '4px'
                                                                                }}
                                                                            >
                                                                                <span
                                                                                    style={{
                                                                                        color: '#fff',
                                                                                        fontSize: '13px',
                                                                                        fontWeight: 500
                                                                                    }}
                                                                                >
                                                                                    {buildDisplayName(reply.user)}
                                                                                </span>
                                                                                <span
                                                                                    style={{
                                                                                        color: '#888',
                                                                                        fontSize: '11px'
                                                                                    }}
                                                                                >
                                                                                    {utils.formatDate(
                                                                                        reply.createdTimestamp,
                                                                                        'DD/MM/YYYY HH:mm'
                                                                                    )}
                                                                                </span>
                                                                            </div>
                                                                            {editingId === reply.id ? (
                                                                                <>
                                                                                    <Input.TextArea
                                                                                        value={editingContent}
                                                                                        onChange={(e) =>
                                                                                            setEditingContent(
                                                                                                e.target.value
                                                                                            )
                                                                                        }
                                                                                        rows={2}
                                                                                        style={{
                                                                                            marginTop: '4px',
                                                                                            backgroundColor: '#262626',
                                                                                            color: '#fff',
                                                                                            borderColor: '#555',
                                                                                            resize: 'none'
                                                                                        }}
                                                                                        maxLength={255}
                                                                                        showCount
                                                                                    />
                                                                                    <div
                                                                                        style={{
                                                                                            marginTop: '8px',
                                                                                            display: 'flex',
                                                                                            justifyContent: 'flex-end',
                                                                                            gap: '8px'
                                                                                        }}
                                                                                    >
                                                                                        <Button
                                                                                            onClick={handleCancelEdit}
                                                                                            disabled={editingSubmitting}
                                                                                        >
                                                                                            Hủy
                                                                                        </Button>
                                                                                        <Button
                                                                                            type="primary"
                                                                                            onClick={handleSubmitEdit}
                                                                                            loading={editingSubmitting}
                                                                                            disabled={
                                                                                                !editingContent.trim()
                                                                                            }
                                                                                        >
                                                                                            Lưu
                                                                                        </Button>
                                                                                    </div>
                                                                                </>
                                                                            ) : (
                                                                                <div
                                                                                    style={{
                                                                                        color: '#ccc',
                                                                                        fontSize: '13px',
                                                                                        whiteSpace: 'pre-wrap'
                                                                                    }}
                                                                                >
                                                                                    {reply.content}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div
                                                                            style={{
                                                                                marginTop: '6px',
                                                                                display: 'flex',
                                                                                gap: '16px'
                                                                            }}
                                                                        >
                                                                            {/* Replies (level 2) cannot be replied to further, only edit/delete or report */}
                                                                            {reply.user?.id === currentUserId && (
                                                                                <>
                                                                                    <Button
                                                                                        type="link"
                                                                                        size="small"
                                                                                        style={{ padding: 0 }}
                                                                                        onClick={() =>
                                                                                            handleStartEdit(reply)
                                                                                        }
                                                                                    >
                                                                                        Sửa
                                                                                    </Button>
                                                                                    <Button
                                                                                        type="link"
                                                                                        size="small"
                                                                                        danger
                                                                                        style={{ padding: 0 }}
                                                                                        loading={
                                                                                            deletingId === reply.id
                                                                                        }
                                                                                        onClick={() =>
                                                                                            handleDeleteComment(
                                                                                                reply.id
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        Xóa
                                                                                    </Button>
                                                                                </>
                                                                            )}
                                                                            {reply.user?.id !== currentUserId && (
                                                                                <Button
                                                                                    type="link"
                                                                                    size="small"
                                                                                    danger
                                                                                    style={{ padding: 0 }}
                                                                                    loading={reportingId === reply.id}
                                                                                    onClick={() =>
                                                                                        handleReportComment(reply.id)
                                                                                    }
                                                                                >
                                                                                    {renderReportLabel(
                                                                                        reply.reportCount
                                                                                    )}
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                        {totalReplies > 1 && (
                                                            <Button
                                                                type="link"
                                                                size="small"
                                                                style={{ padding: 0, marginLeft: '56px' }}
                                                                onClick={() =>
                                                                    setReplyVisibleMap((prev) => {
                                                                        const current =
                                                                            prev[comment.id] ??
                                                                            Math.min(1, totalReplies);
                                                                        const hasMore = current < totalReplies;
                                                                        return {
                                                                            ...prev,
                                                                            [comment.id]: hasMore ? totalReplies : 1
                                                                        };
                                                                    })
                                                                }
                                                            >
                                                                {(replyVisibleMap[comment.id] ??
                                                                    Math.min(1, totalReplies)) < totalReplies
                                                                    ? `Xem thêm ${
                                                                          totalReplies -
                                                                          (replyVisibleMap[comment.id] ??
                                                                              Math.min(1, totalReplies))
                                                                      } trả lời`
                                                                    : 'Ẩn bớt trả lời'}
                                                            </Button>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </List.Item>
                    )}
                />
                {comments.length > commentListData.length && (
                    <div style={{ textAlign: 'center', marginTop: '12px' }}>
                        <Button
                            type="link"
                            onClick={() => setVisibleTopCount((prev) => Math.min(prev + 5, comments.length))}
                        >
                            Xem thêm bình luận
                        </Button>
                    </div>
                )}
                {comments.length > 5 && commentListData.length > 5 && (
                    <div style={{ textAlign: 'center', marginTop: '4px' }}>
                        <Button type="link" onClick={() => setVisibleTopCount(5)}>
                            Ẩn bớt bình luận
                        </Button>
                    </div>
                )}
            </div>
            <Modal open={!!deleteTargetId} title="Xóa bình luận" footer={null} onCancel={handleCancelDelete}>
                <p>Bạn có chắc chắn muốn xóa bình luận này?</p>
                <div
                    style={{
                        marginTop: 16,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 8
                    }}
                >
                    <Button onClick={handleCancelDelete} disabled={!!deletingId}>
                        Hủy
                    </Button>
                    <Button type="primary" danger loading={!!deletingId} onClick={handleConfirmDelete}>
                        Xóa
                    </Button>
                </div>
            </Modal>
            <div className="pt-8 border-top" style={{ borderColor: '#464646' }}>
                <div className="flex gap p-4">
                    <Input.TextArea
                        className="overflow lampnt"
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
                        className={classnames('ant-btn-send', { 'disabled-2': !newComment.trim() })}
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={handleSubmitComment}
                        loading={submitting}
                        disabled={!newComment.trim()}
                        style={{
                            alignSelf: 'flex-end'
                        }}
                    >
                        Gửi
                    </Button>
                </div>
            </div>
        </div>
    );
});

export default Comments;
