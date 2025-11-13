import {
    AppstoreAddOutlined,
    BellOutlined,
    BugOutlined,
    CloudUploadOutlined,
    GithubOutlined,
    LeftOutlined,
    LoadingOutlined,
    RightOutlined,
    SettingOutlined,
    WechatOutlined
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import { Select, Skeleton, Modal, Button } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import AIAssistant from '../../components/AIAssistant/AIAssistant';
import ProtectedElement from '../../components/ProtectedElement/ProtectedElement';
import classnames from 'classnames';
import * as FlexLayout from 'flexlayout-react';
import 'flexlayout-react/style/light.css';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import globalStore from '../../components/GlobalComponent/globalStore';
import { programmingLanguages } from '../../constants/languages';
import * as http from '../../lib/httpRequest';
import routesConfig from '../../routes/routesConfig';
import utils from '../../utils/utils';
import authentication from '../../shared/auth/authentication';
import ExamCountdownTimer from '../ExamDetail/components/ExamCountdownTimer';

const json = {
    global: { tabSetEnableClose: false },
    layout: {
        type: 'row',
        weight: 100,
        children: [
            {
                type: 'tabset',
                weight: 35,
                children: [
                    {
                        type: 'tab',
                        name: 'Mô tả',
                        component: 'desc',
                        icon: '/sources/icons/description-ico.svg'
                    }
                ]
            },
            {
                type: 'column',
                weight: 65,
                children: [
                    {
                        type: 'tabset',
                        weight: 50,
                        children: [
                            {
                                type: 'tab',
                                name: 'Code',
                                component: 'editor',
                                icon: '/sources/icons/code-ico.svg'
                            }
                        ]
                    },
                    {
                        type: 'tabset',
                        weight: 50,
                        children: [
                            {
                                type: 'tab',
                                name: 'TestResult',
                                component: 'testResult',
                                icon: '/sources/icons/test-result-ico.svg'
                            },
                            {
                                type: 'tab',
                                name: 'Testcase',
                                component: 'testcase',
                                icon: '/sources/icons/testcase-ico.svg'
                            }
                        ]
                    }
                ]
            }
        ]
    }
};

const ExamExercise = observer(() => {
    const { examId, exerciseId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    if (!examId || !exerciseId) {
        globalStore.triggerNotification('error', 'Exam hoặc Exercise không tồn tại!', '');
        navigate(`/${routesConfig.exams}`);
        return <></>;
    }

    const [model] = useState(FlexLayout.Model.fromJson(json));
    const layoutRef = useRef<FlexLayout.Layout | null>(null);

    const [language, setLanguage] = useState<number>(45);
    const [theme] = useState<'light' | 'vs-dark'>('vs-dark');
    const [exercise, setExercise] = useState<any>(null);
    const [editorValue, setEditorValue]: any = useState('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [response, setResponse] = useState<any>(null);
    const [selectedCaseResult, setSelectedCaseResult] = useState<any>(1);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [pendingPath, setPendingPath] = useState<string | null>(null);
    const isNavigatingRef = useRef(false);

    const getDefaultTemplate = (lang: string): string => {
        switch (lang) {
            case 'python':
                return '# Write your Python code here';
            case 'cpp':
                return '#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    return 0;\n}';
            case 'java':
                return 'public class Main {\n    public static void main(String[] args) {\n        \n    }\n}';
            case 'javascript':
                return 'console.log("Hello, world!");';
            case 'typescript':
                return 'console.log("Hello from TypeScript!");';
            case 'c':
                return '#include <stdio.h>\nint main() {\n    int a, b;\n    scanf("%d %d", &a, &b);\n    printf("%d\\n", a + b);\n    return 0;\n}';
            case 'csharp':
                return 'using System;\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, world!");\n    }\n}';
            case 'go':
                return 'package main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello, world!");\n}';
            case 'rust':
                return 'fn main() {\n    println!("Hello, world!");\n}';
            case 'kotlin':
                return 'fun main() {\n    println("Hello, world!")\n}';
            case 'php':
                return '<?php\necho "Hello, world!";';
            case 'swift':
                return 'print("Hello, world!")';
            default:
                return '// Start coding here';
        }
    };

    const selectedLang = programmingLanguages.find((lang) => lang.id === language);
    const editorLanguage = selectedLang?.editorValue || 'javascript';

    const testRun = () => {
        setError('');
        setLoading(true);

        const payload = { exerciseId: exerciseId, languageCode: language, sourceCode: editorValue };
        http.post('/submissions/run', payload)
            .then((res) => {
                console.log('log:', res);
                setResponse(res);
            })
            .catch((error) => {
                setError(error.response?.data?.message || 'Có lỗi xảy ra!');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const submit = () => {
        setError('');
        setLoading(true);

        const payload = {
            examId: examId,
            exerciseId: exerciseId,
            sourceCode: editorValue,
            languageCode: language
        };
        http.post('/exams/submissions', payload)
            .then((res) => {
                console.log('log:', res);
                setResponse(res);
                // globalStore.triggerNotification('success', 'Nộp bài thành công!', '');

                // Nếu nộp bài thành công (status 201), quay lại trang bài tập
                if (res.status === 201 && examId) {
                    setTimeout(() => {
                        navigate(`/${routesConfig.exam}`.replace(':id', examId));
                    }, 1000); // Đợi 1 giây để user thấy thông báo thành công
                }
            })
            .catch((error) => {
                setError(error.response?.data?.message || 'Có lỗi xảy ra!');
                globalStore.triggerNotification('error', error.response?.data?.message || 'Nộp bài thất bại!', '');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const factory = (node: any) => {
        const component = node.getComponent();
        if (component === 'desc') {
            return (
                <div className="exercise-description">
                    <h2 className="header">{exercise?.title || 'Title'}</h2>
                    <div className="tags">
                        <div className="tag difficulty">
                            {utils.capitalizeFirstLetter(exercise?.difficulty) || 'Difficulty'}
                        </div>
                        <div className="topics">
                            {exercise?.topics?.map((topic: any) => {
                                return (
                                    <div key={topic.id} className="tag topic">
                                        {topic.name}
                                    </div>
                                );
                            }) || 'Topics'}
                        </div>
                    </div>
                    <p className="description">{exercise?.description || 'Description'}</p>
                    <div className="test-cases">
                        {exercise?.testCases?.map((testCase: any, index: any) => {
                            return testCase.isPublic ? (
                                <div key={testCase.id} className="test-case">
                                    <strong className="header">Example {index + 1}:</strong>
                                    <div className="io">
                                        <div className="input">
                                            <strong>Input:</strong> {testCase.input}
                                        </div>
                                        <div className="input">
                                            <strong>Output:</strong> {testCase.output}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <></>
                            );
                        }) || 'Test Cases'}
                    </div>
                </div>
            );
        } else if (component === 'editor') {
            return (
                <div className="code">
                    <div className="actions">
                        <Select
                            value={language}
                            onChange={(val) => setLanguage(val)}
                            options={programmingLanguages}
                            style={{ width: 200 }}
                        />
                    </div>
                    <div className="code-container">
                        <Editor
                            height="100%"
                            theme={theme}
                            language={editorLanguage}
                            value={editorValue}
                            options={{
                                fontSize: 14,
                                minimap: { enabled: false },
                                automaticLayout: true
                            }}
                            onChange={(value) => setEditorValue(value)}
                        />
                    </div>
                </div>
            );
        } else if (component === 'testResult') {
            return (
                <div className="testResult">
                    {loading && (
                        <>
                            <LoadingOutlined className="mb-px" style={{ color: '#555555', fontSize: 20 }} />
                            <Skeleton active />
                        </>
                    )}
                    {error && (
                        <div className="error">
                            <div className="error-header">Error</div>
                            <div className="error-content">{error}</div>
                        </div>
                    )}
                    {response && !loading && !response?.data?.verdict && (
                        <div className="response">
                            <div
                                className={classnames(
                                    'response-header',
                                    response?.data?.allPassed ? 'accepted' : 'wrong'
                                )}
                            >
                                <div className="header">{response?.data?.allPassed ? 'Accepted' : 'Wrong Answer'}</div>
                            </div>
                            <div className="response-content">
                                <div className="group-testcases">
                                    <div className="btns">
                                        {response?.data?.results?.map((item: any, index: any) => {
                                            return (
                                                <div
                                                    key={index}
                                                    className={classnames('btn', {
                                                        selected: index + 1 == selectedCaseResult
                                                    })}
                                                    onClick={() => setSelectedCaseResult(index + 1)}
                                                >
                                                    <img
                                                        src={
                                                            item.passed
                                                                ? '/sources/icons/green-check.svg'
                                                                : '/sources/icons/red-xmark.svg'
                                                        }
                                                        alt=""
                                                    />
                                                    {`Case ${index + 1}`}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="testcase">
                                        {response?.data?.results?.map((item: any, index: any) => {
                                            return (
                                                <div
                                                    key={index}
                                                    className={classnames('io', {
                                                        hide: index + 1 != selectedCaseResult
                                                    })}
                                                >
                                                    <div className="input wrapper">
                                                        <div className="label">Input</div>
                                                        <div className="content">{item.input}</div>
                                                    </div>
                                                    <div className="expected-output wrapper">
                                                        <div className="label">Expected Output</div>
                                                        <div className="content">{item.expectedOutput}</div>
                                                    </div>
                                                    <div
                                                        className={classnames('actual-output wrapper', {
                                                            match: item.passed
                                                        })}
                                                    >
                                                        <div className="label">Actual Output</div>
                                                        <div className="content">{item.actualOutput}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {response && !loading && response?.data?.verdict && (
                        <div className="response">
                            <div
                                className={classnames('response-header', {
                                    accepted: response?.data?.verdict == 'ACCEPTED',
                                    wrong: response?.data?.verdict != 'ACCEPTED'
                                })}
                            >
                                <div className="header">{utils.capitalizeFirstLetter(response?.data?.verdict)}</div>
                            </div>
                            <div className="solution">
                                <div className="header">Gợi ý lời giải</div>
                                <div className="content">{response?.data?.exercise?.solution}</div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    useEffect(() => {
        document.body.classList.add('independence-page');

        const handleResize = () => {
            layoutRef.current?.forceUpdate();
        };

        window.addEventListener('resize', handleResize);

        // Get exercise
        http.get(`/exercises/${exerciseId}`)
            .then((res) => {
                setExercise(res.data);
            })
            .catch((error) => {
                console.error('Error fetching exercise:', error);
                globalStore.triggerNotification('error', 'Không thể tải thông tin bài tập!', '');
            });

        return () => {
            document.body.classList.remove('independence-page');
            window.removeEventListener('resize', handleResize);
        };
    }, [exerciseId]);

    useEffect(() => {
        const newEditorValue = getDefaultTemplate(editorLanguage);
        setEditorValue(newEditorValue);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language]);

    // Cảnh báo khi đóng tab hoặc refresh
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = 'Nếu bạn thoát, tất cả những code của bạn không được lưu';
            return e.returnValue;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    // Intercept browser back button
    useEffect(() => {
        // Push một state vào history để có thể intercept back button
        window.history.pushState(null, '', location.pathname);

        const handlePopState = () => {
            if (!isNavigatingRef.current) {
                // Push lại state để giữ user ở trang hiện tại
                window.history.pushState(null, '', location.pathname);
                setShowExitConfirm(true);
                // Lấy path từ history trước đó (nếu có)
                setPendingPath(`/${routesConfig.exam}`.replace(':id', examId || ''));
            }
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [location.pathname, examId]);

    const handleNavigate = (path: string) => {
        setPendingPath(path);
        setShowExitConfirm(true);
    };

    const handleConfirmExit = () => {
        if (pendingPath) {
            isNavigatingRef.current = true;
            navigate(pendingPath);
        }
        setShowExitConfirm(false);
        setPendingPath(null);
    };

    const handleCancelExit = () => {
        setShowExitConfirm(false);
        setPendingPath(null);
    };

    // Reset flag sau khi navigation hoàn tất
    useEffect(() => {
        isNavigatingRef.current = false;
    }, [location.pathname]);

    return (
        <div className="exercise">
            <div className="container">
                <div className="header">
                    <div className="left">
                        <div className="group-btn">
                            <GithubOutlined className="icon" />
                            <LeftOutlined
                                className="icon"
                                onClick={() => handleNavigate(`/${routesConfig.exam}`.replace(':id', examId || ''))}
                            />
                            <RightOutlined className="icon" />
                        </div>
                    </div>
                    <div className="center">
                        <div
                            className={classnames('group-btn', { disabled: loading })}
                            style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
                        >
                            <BugOutlined className="icon" style={{ color: '#FFA118' }} />
                            {loading ? (
                                <div className="icon">
                                    <LoadingOutlined />
                                </div>
                            ) : (
                                <div className="icon" onClick={testRun}>
                                    <img src="/sources/icons/play-ico.svg" alt="" />
                                </div>
                            )}
                            <div className="icon submit-btn" onClick={submit}>
                                {loading ? (
                                    <LoadingOutlined style={{ fontSize: 18 }} />
                                ) : (
                                    <CloudUploadOutlined style={{ fontSize: 18 }} />
                                )}
                                Nộp bài
                            </div>
                            {examId && !authentication.isInstructor && (
                                <div style={{ marginLeft: '8px', display: 'flex', alignItems: 'center' }}>
                                    <ExamCountdownTimer examId={examId} compact={true} />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="right">
                        <div className="group-btn">
                            <SettingOutlined className="icon" />
                            <BellOutlined className="icon" />
                            <WechatOutlined className="icon" />
                            <AppstoreAddOutlined className="icon" />
                        </div>
                    </div>
                </div>
                <div className="flex-layout">
                    <FlexLayout.Layout ref={layoutRef} model={model} factory={factory} />
                </div>
            </div>
            <Modal
                open={showExitConfirm}
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 20 }} />
                        <span>Xác nhận thoát</span>
                    </div>
                }
                onCancel={handleCancelExit}
                footer={null}
            >
                <p>Nếu bạn thoát, tất cả những code của bạn không được lưu.</p>
                <p>Bạn có chắc chắn muốn thoát không?</p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
                    <Button onClick={handleCancelExit}>Không</Button>
                    <Button type="primary" danger onClick={handleConfirmExit}>
                        Có
                    </Button>
                </div>
            </Modal>
            <ProtectedElement acceptRoles={['STUDENT']}>
                <AIAssistant />
            </ProtectedElement>
        </div>
    );
});

export default ExamExercise;
