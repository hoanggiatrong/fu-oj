import { CloseOutlined, SendOutlined } from '@ant-design/icons';
import { Avatar, Input } from 'antd';
import classnames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useState, useRef, useEffect, useCallback } from 'react';
import * as http from '../../lib/httpRequest';
import './ai-assistant.scss';

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

interface AIAssistantProps {
    defaultOpen?: boolean;
    exerciseId?: string;
    autoMessage?: string;
}

const AIAssistant = observer(({ defaultOpen, exerciseId, autoMessage }: AIAssistantProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'Xin chào! Mình là trợ lý FU-OJ. Mình có thể giúp bạn giải quyết các vấn đề về thuật toán và lập trình. Bạn cần hỗ trợ gì không?',
            isUser: false,
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [hasAutoSent, setHasAutoSent] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSendMessage = useCallback(
        async (messageText?: string, skipUserMessage: boolean = false) => {
            const textToSend = messageText ? messageText.trim() : inputValue.trim();
            if (!textToSend || isTyping) return;

            if (!skipUserMessage) {
                const userMessage: Message = {
                    id: Date.now().toString(),
                    text: textToSend,
                    isUser: true,
                    timestamp: new Date()
                };
                setMessages((prev) => [...prev, userMessage]);
                setInputValue('');
            }

            setIsTyping(true);

            try {
                const requestBody: any = { message: textToSend };
                if (exerciseId) {
                    requestBody.exerciseId = exerciseId;
                }
                const response = await http.post('/chat', requestBody);
                const aiMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    text:
                        response?.data?.messageResponse ||
                        response?.messageResponse ||
                        response?.message ||
                        'Xin lỗi, không thể xử lý yêu cầu của bạn.',
                    isUser: false,
                    timestamp: new Date()
                };
                setMessages((prev) => [...prev, aiMessage]);
            } catch (error: any) {
                const errorMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    text:
                        error?.response?.data?.message ||
                        error?.message ||
                        'Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại sau.',
                    isUser: false,
                    timestamp: new Date()
                };
                setMessages((prev) => [...prev, errorMessage]);
            } finally {
                setIsTyping(false);
            }
        },
        [inputValue, isTyping, exerciseId]
    );

    // const handleKeyPress = (e: React.KeyboardEvent) => {
    //     if (e.key === 'Enter' && !e.shiftKey) {
    //         e.preventDefault();
    //         handleSendMessage();
    //     }
    // };

    useEffect(() => {
        if (defaultOpen) {
            setIsOpen(true);
        }
    }, [defaultOpen]);

    // Tự động gửi message khi tab được mở và có autoMessage
    useEffect(() => {
        if (defaultOpen && autoMessage && !hasAutoSent && isOpen) {
            setHasAutoSent(true);
            // Delay một chút để đảm bảo UI đã render
            const timer = setTimeout(() => {
                handleSendMessage(autoMessage, false);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [defaultOpen, autoMessage, isOpen, hasAutoSent, handleSendMessage]);

    return (
        <div className="ai-assistant-container">
            {!isOpen && (
                <div className="ai-assistant-button" onClick={() => setIsOpen(true)}>
                    <Avatar
                        size={56}
                        style={{
                            backgroundColor: '#ff6b35',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)'
                        }}
                    >
                        <span style={{ fontSize: '24px' }}>🤖</span>
                    </Avatar>
                </div>
            )}

            {isOpen && (
                <div className="ai-assistant-chat" ref={chatContainerRef}>
                    <div className="ai-assistant-header">
                        <div className="ai-assistant-header-info">
                            <Avatar
                                size={40}
                                style={{
                                    backgroundColor: '#ff6b35',
                                    marginRight: '12px'
                                }}
                            >
                                <span style={{ fontSize: '20px' }}>🤖</span>
                            </Avatar>
                            <div>
                                <div className="ai-assistant-title">Trợ lý FU-OJ</div>
                                <div className="ai-assistant-subtitle">Đang hoạt động</div>
                            </div>
                        </div>
                        <CloseOutlined className="ai-assistant-close" onClick={() => setIsOpen(false)} />
                    </div>

                    <div className="ai-assistant-messages">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={classnames('ai-assistant-message', {
                                    'ai-assistant-message-user': message.isUser,
                                    'ai-assistant-message-ai': !message.isUser
                                })}
                            >
                                {!message.isUser && (
                                    <Avatar
                                        size={32}
                                        style={{
                                            backgroundColor: '#ff6b35',
                                            marginRight: '8px',
                                            flexShrink: 0
                                        }}
                                    >
                                        <span style={{ fontSize: '16px' }}>🤖</span>
                                    </Avatar>
                                )}
                                <div className="ai-assistant-message-bubble">{message.text}</div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="ai-assistant-message ai-assistant-message-ai">
                                <Avatar
                                    size={32}
                                    style={{
                                        backgroundColor: '#ff6b35',
                                        marginRight: '8px',
                                        flexShrink: 0
                                    }}
                                >
                                    <span style={{ fontSize: '16px' }}>🤖</span>
                                </Avatar>
                                <div className="ai-assistant-message-bubble ai-assistant-typing">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="ai-assistant-input-container">
                        <div className="ai-input-wrapper overflow">
                            <Input.TextArea
                                className="ai-assistant-input"
                                placeholder="Nhập câu hỏi của bạn..."
                                value={inputValue}
                                onChange={(e: any) => setInputValue(e.target.value)}
                                autoSize={{ minRows: 1, maxRows: 5 }}
                                rows={2}
                                disabled={isTyping}
                                onKeyDown={(e: any) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                            />

                            <SendOutlined
                                className={classnames('ai-assistant-send', {
                                    'ai-assistant-send-disabled': !inputValue.trim() || isTyping
                                })}
                                onClick={() => handleSendMessage()}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default AIAssistant;
