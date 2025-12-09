import { Card, Col, Empty, Input, Modal, Row } from 'antd';
import classnames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import Highlighter from 'react-highlight-words';
import { Avatar, Typography } from 'antd';
import CustomCalendar from '../../components/CustomCalendar/CustomCalendar';
import globalStore from '../../components/GlobalComponent/globalStore';
import LoadingOverlay from '../../components/LoadingOverlay/LoadingOverlay';
import * as http from '../../lib/httpRequest';
import './certificates.scss';

const { Meta } = Card;
const { Text } = Typography;

interface UserProfileDTO {
    rollNumber?: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    avatar?: {
        url?: string;
    };
}

interface CourseResponseDTO {
    title: string;
    description?: string;
}

interface CertificateResponseDTO {
    id: string;
    user: UserProfileDTO;
    course: CourseResponseDTO;
    reason: string;
    createdAt?: number;
    updatedAt?: number;
}

const Certificates = observer(() => {
    const [loading, setLoading] = useState(false);
    const [certificates, setCertificates] = useState<CertificateResponseDTO[]>([]);
    const [displayCertificates, setDisplayCertificates] = useState<CertificateResponseDTO[]>([]);
    const [search, setSearch] = useState('');
    const [selectedCertificate, setSelectedCertificate] = useState<CertificateResponseDTO | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const getCertificates = () => {
        setLoading(true);
        http.get('/certificates', { params: { query: search } })
            .then((res) => {
                setCertificates(res.data || []);
                setDisplayCertificates(res.data || []);
            })
            .catch((error) => {
                globalStore.triggerNotification('error', error.response?.data?.message || 'Lỗi khi tải danh sách chứng chỉ', '');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        getCertificates();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!search) {
            setDisplayCertificates(certificates);
            return;
        }

        const filtered = certificates.filter(
            (cert) =>
                cert.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
                cert.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
                cert.user?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
                cert.course?.title?.toLowerCase().includes(search.toLowerCase()) ||
                cert.course?.description?.toLowerCase().includes(search.toLowerCase()) ||
                cert.reason?.toLowerCase().includes(search.toLowerCase())
        );
        setDisplayCertificates(filtered);
    }, [search, certificates]);

    const getUserDisplayName = (user: UserProfileDTO) => {
        if (user.firstName || user.lastName) {
            return `${user.firstName || ''} ${user.lastName || ''}`.trim();
        }
        return user.email;
    };

    const handleCertificateClick = (cert: CertificateResponseDTO) => {
        setSelectedCertificate(cert);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedCertificate(null);
    };

    return (
        <div className={classnames('leetcode', globalStore.isBelow1300 ? 'col' : 'row')}>
            <div className={classnames('certificates left', { 'p-24': globalStore.isBelow1300 })}>
                <div className="header">
                    <div className="title">Chứng chỉ</div>
                    <div className="description">
                        Danh sách các chứng chỉ đã được cấp cho học viên sau khi hoàn thành khóa học.
                    </div>
                </div>
                <div className="wrapper flex">
                    <div className="filters">
                        <Input
                            placeholder="Tìm kiếm chứng chỉ"
                            onChange={(e) => setSearch(e.target.value)}
                            value={search}
                        />
                    </div>

                    <div className="body">
                        <LoadingOverlay loading={loading}>
                            <div className="content mb-36">
                                <Row gutter={[16, 16]}>
                                    {displayCertificates.length ? (
                                        displayCertificates.map((cert) => (
                                            <Col
                                                key={cert.id}
                                                xs={24}
                                                sm={12}
                                                md={12}
                                                lg={8}
                                                xl={8}
                                            >
                                                <Card
                                                    onClick={() => handleCertificateClick(cert)}
                                                    style={{ cursor: 'pointer' }}
                                                    hoverable
                                                    cover={
                                                        <div className="custom-card-header">
                                                            <div className="name">
                                                                <Highlighter
                                                                    highlightClassName="highlight"
                                                                    searchWords={[search]}
                                                                    autoEscape={true}
                                                                    textToHighlight={cert.course?.title || 'Không có tiêu đề'}
                                                                />
                                                            </div>
                                                        </div>
                                                    }
                                                >
                                                    <Meta
                                                        avatar={
                                                            <Avatar
                                                                src={cert.user?.avatar?.url}
                                                                size={40}
                                                            >
                                                                {getUserDisplayName(cert.user).charAt(0).toUpperCase()}
                                                            </Avatar>
                                                        }
                                                        title={
                                                            <Highlighter
                                                                highlightClassName="highlight"
                                                                searchWords={[search]}
                                                                autoEscape={true}
                                                                textToHighlight={getUserDisplayName(cert.user)}
                                                            />
                                                        }
                                                        description={
                                                            <Highlighter
                                                                highlightClassName="highlight"
                                                                searchWords={[search]}
                                                                autoEscape={true}
                                                                textToHighlight={cert.user?.email || ''}
                                                            />
                                                        }
                                                    />
                                                    <div className="certificate-infos">
                                                        <div className="course-info">
                                                            <Text type="secondary" className="label">
                                                                Khóa học:
                                                            </Text>
                                                            <div className="course-title">
                                                                <Highlighter
                                                                    highlightClassName="highlight"
                                                                    searchWords={[search]}
                                                                    autoEscape={true}
                                                                    textToHighlight={cert.course?.title || 'N/A'}
                                                                />
                                                            </div>
                                                        </div>
                                                        {cert.reason && (
                                                            <div className="reason-info">
                                                                <Text type="secondary" className="label">
                                                                    Lý do:
                                                                </Text>
                                                                <div className="reason-text">
                                                                    <Highlighter
                                                                        highlightClassName="highlight"
                                                                        searchWords={[search]}
                                                                        autoEscape={true}
                                                                        textToHighlight={cert.reason}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                        {cert.user?.rollNumber && (
                                                            <div className="roll-number">
                                                                <Text type="secondary">
                                                                    Mã số: {cert.user.rollNumber}
                                                                </Text>
                                                            </div>
                                                        )}
                                                    </div>
                                                </Card>
                                            </Col>
                                        ))
                                    ) : (
                                        <Empty
                                            className="flex flex-col flex-center max-width"
                                            style={{ minHeight: 300 }}
                                            description="Chưa có chứng chỉ nào"
                                        />
                                    )}
                                </Row>
                            </div>
                        </LoadingOverlay>
                    </div>
                </div>
            </div>
            <div className="right">
                <CustomCalendar />
            </div>

            <Modal
                open={modalOpen}
                onCancel={handleCloseModal}
                footer={null}
                width={900}
                centered
                className="certificate-modal"
                destroyOnClose={true}
                maskClosable={true}
            >
                {selectedCertificate && (
                    <div className="certificate-container">
                        <div className="certificate-border">
                            <div className="certificate-content">
                                <div className="certificate-header">
                                    <div className="certificate-title">CHỨNG CHỈ</div>
                                    <div className="certificate-subtitle">HOÀN THÀNH KHÓA HỌC</div>
                                    <div className="certificate-separator">
                                        <div className="separator-diamond separator-diamond--blue"></div>
                                        <div className="separator-diamond separator-diamond--gold"></div>
                                        <div className="separator-diamond separator-diamond--blue"></div>
                                    </div>
                                </div>

                                <div className="certificate-body">
                                    <div className="certificate-intro">
                                        Chứng chỉ này được trao cho
                                    </div>
                                    <div className="certificate-name">
                                        {getUserDisplayName(selectedCertificate.user)}
                                    </div>
                                    <div className="certificate-description">
                                        <p>
                                            Đã hoàn thành xuất sắc khóa học <strong>{selectedCertificate.course?.title || 'Khóa học'}</strong> và
                                            thể hiện sự tận tâm, kiên trì và nắm vững kiến thức trong lĩnh vực này.
                                            {selectedCertificate.reason && (
                                                <> Thành tích này phản ánh: <strong>{selectedCertificate.reason}</strong>.</>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="certificate-seal">
                                    <div className="seal-circle">
                                        <div className="seal-content">
                                            <div className="seal-top">TOP</div>
                                            <div className="seal-center">BRAND</div>
                                            <div className="seal-bottom">AWARD</div>
                                        </div>
                                    </div>
                                    <div className="seal-ribbon"></div>
                                </div>

                                {selectedCertificate.user?.rollNumber && (
                                    <div className="certificate-code">
                                        Mã số chứng chỉ: <strong>{selectedCertificate.user.rollNumber}</strong>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
});

export default Certificates;


